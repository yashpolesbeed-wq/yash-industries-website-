require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { pool } = require("./db.cjs");
const { initializeDatabase } = require("./init-db.cjs");

const app = express();
const port = Number(process.env.API_PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || "change-this-secret";
const uploadsDir = path.join(__dirname, "uploads");
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".bmp", ".avif", ".ico", ".tif", ".tiff"]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/bmp",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/tiff",
]);

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeName = path
      .basename(file.originalname || "upload", extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    cb(null, `${Date.now()}-${safeName || "image"}${extension || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeType = (file.mimetype || "").toLowerCase();
    const isAllowedExtension = allowedImageExtensions.has(extension);
    const isAllowedMimeType = allowedMimeTypes.has(mimeType) || mimeType.startsWith("image/");

    if (isAllowedExtension || isAllowedMimeType) {
      return cb(null, true);
    }

    return cb(new Error("Only image files are allowed. Please upload a valid image format."));
  },
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Yash Industries API</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #020617;
            color: #e2e8f0;
            display: grid;
            place-items: center;
            min-height: 100vh;
          }
          .card {
            max-width: 680px;
            margin: 24px;
            padding: 32px;
            border-radius: 20px;
            background: #0f172a;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
          }
          h1 {
            margin-top: 0;
            color: #f59e0b;
          }
          code {
            background: #1e293b;
            padding: 2px 8px;
            border-radius: 8px;
          }
          ul {
            line-height: 1.8;
            padding-left: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Yash Industries API is running</h1>
          <p>This port is for the backend API only.</p>
          <ul>
            <li>Frontend website: <code>http://localhost:8080</code></li>
            <li>API health check: <code>http://localhost:3001/api/health</code></li>
            <li>Admin login page: <code>http://localhost:8080/yash-industries-my-admin-0.1</code></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

const parseJsonArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (_error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const parseJsonObjectField = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [String(key), String(itemValue)]),
    );
  }

  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([key, itemValue]) => [String(key), String(itemValue)]),
        );
      }
    } catch (_error) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .reduce((acc, entry) => {
          const [key, ...rest] = entry.split(":");
          const fieldValue = rest.join(":").trim();
          if (key?.trim() && fieldValue) {
            acc[key.trim()] = fieldValue;
          }
          return acc;
        }, {});
    }
  }

  return {};
};

const normalizeProduct = (row, galleryRows = []) => ({
  id: String(row.id),
  name: row.name,
  slug: row.slug,
  shortDescription: row.short_description,
  description: row.description,
  image: row.image,
  category: row.category,
  material: row.material,
  height: row.height,
  shape: row.shape,
  finish: row.finish,
  applications: parseJsonArrayField(row.applications_json),
  customization: parseJsonArrayField(row.customization_json),
  moq: row.moq,
  specifications: parseJsonObjectField(row.specifications_json),
  galleryImages: galleryRows.map((galleryRow) => galleryRow.image_url),
});

const normalizeSiteGalleryItem = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description,
  imageUrl: row.image_url,
  sortOrder: row.sort_order,
});

const getDatabaseErrorMessage = (error, entityLabel, duplicateFieldLabel = "value") => {
  if (!error) {
    return `Failed to save ${entityLabel}`;
  }

  if (error.code === "ER_DUP_ENTRY") {
    return `${duplicateFieldLabel} already exists. Please use a different ${duplicateFieldLabel.toLowerCase()}.`;
  }

  if (error.code === "ER_BAD_NULL_ERROR") {
    return `Some required ${entityLabel} fields are missing.`;
  }

  if (error.code === "ER_DATA_TOO_LONG") {
    return `One of the ${entityLabel} fields is too long. Please shorten it and try again.`;
  }

  return `Failed to save ${entityLabel}`;
};

const fetchProducts = async () => {
  const [products] = await pool.query("SELECT * FROM products ORDER BY created_at ASC, id ASC");
  const [gallery] = await pool.query("SELECT * FROM product_gallery ORDER BY sort_order ASC, id ASC");

  const galleryByProductId = gallery.reduce((acc, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = [];
    }
    acc[item.product_id].push(item);
    return acc;
  }, {});

  return products.map((product) => normalizeProduct(product, galleryByProductId[product.id] || []));
};

const fetchSiteGallery = async () => {
  const [rows] = await pool.query("SELECT * FROM site_gallery ORDER BY sort_order ASC, id ASC");
  return rows.map(normalizeSiteGalleryItem);
};

const validateProductPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Invalid product data received";
  }

  const requiredFields = [
    "name",
    "slug",
    "shortDescription",
    "description",
    "image",
    "category",
    "material",
    "height",
    "shape",
    "finish",
    "moq",
  ];

  for (const field of requiredFields) {
    if (!String(payload[field] || "").trim()) {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(payload.applications) || payload.applications.length === 0) {
    return "applications must contain at least one value";
  }

  if (!Array.isArray(payload.customization) || payload.customization.length === 0) {
    return "customization must contain at least one value";
  }

  if (!payload.specifications || typeof payload.specifications !== "object" || Array.isArray(payload.specifications)) {
    return "specifications must be an object";
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (_req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.get("/api/products/:slug", async (req, res) => {
  try {
    const products = await fetchProducts();
    const product = products.find((item) => item.slug === req.params.slug);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to load product" });
  }
});

app.get("/api/gallery", async (_req, res) => {
  try {
    const galleryItems = await fetchSiteGallery();
    res.json(galleryItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load gallery" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [admins] = await pool.query("SELECT * FROM admins WHERE username = ?", [username]);
    const admin = admins[0];

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, jwtSecret, { expiresIn: "8h" });
    return res.json({ token, username: admin.username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/admin/products", authMiddleware, async (_req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load admin products" });
  }
});

app.get("/api/admin/gallery", authMiddleware, async (_req, res) => {
  try {
    const galleryItems = await fetchSiteGallery();
    res.json(galleryItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load gallery items" });
  }
});

app.post("/api/admin/upload-image", authMiddleware, (req, res) => {
  upload.single("image")(req, res, (error) => {
    try {
      if (error) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Image size must be 50 MB or smaller" });
        }

        return res.status(400).json({ message: error.message || "Upload failed" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      return res.status(201).json({
        url: `${baseUrl}/uploads/${req.file.filename}`,
        filename: req.file.filename,
      });
    } catch (handlerError) {
      console.error("Upload handler failed", handlerError);
      return res.status(500).json({ message: "Image upload failed unexpectedly" });
    }
  });
});

app.post("/api/admin/products", authMiddleware, async (req, res) => {
  const validationError = validateProductPayload(req.body ?? {});

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      slug,
      shortDescription,
      description,
      image,
      category,
      material,
      height,
      shape,
      finish,
      applications,
      customization,
      moq,
      specifications,
      galleryImages = [],
    } = req.body;

    const [result] = await connection.query(
      `
        INSERT INTO products (
          name, slug, short_description, description, image, category, material, height,
          shape, finish, applications_json, customization_json, moq, specifications_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        slug.trim(),
        shortDescription.trim(),
        description.trim(),
        image.trim(),
        category.trim(),
        material.trim(),
        height.trim(),
        shape.trim(),
        finish.trim(),
        JSON.stringify(applications),
        JSON.stringify(customization),
        moq.trim(),
        JSON.stringify(specifications),
      ],
    );

    for (const [index, imageUrl] of galleryImages.entries()) {
      if (String(imageUrl).trim()) {
        await connection.query(
          "INSERT INTO product_gallery (product_id, image_url, sort_order) VALUES (?, ?, ?)",
          [result.insertId, String(imageUrl).trim(), index],
        );
      }
    }

    await connection.commit();
    const products = await fetchProducts();
    const created = products.find((item) => item.id === String(result.insertId));
    return res.status(201).json(created);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    const statusCode = error?.code === "ER_DUP_ENTRY" ? 400 : 500;
    return res.status(statusCode).json({ message: getDatabaseErrorMessage(error, "product", "Slug") });
  } finally {
    connection.release();
  }
});

app.put("/api/admin/products/:id", authMiddleware, async (req, res) => {
  const validationError = validateProductPayload(req.body ?? {});

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      name,
      slug,
      shortDescription,
      description,
      image,
      category,
      material,
      height,
      shape,
      finish,
      applications,
      customization,
      moq,
      specifications,
      galleryImages = [],
    } = req.body;

    const [existingRows] = await connection.query("SELECT id FROM products WHERE id = ?", [req.params.id]);

    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    await connection.query(
      `
        UPDATE products
        SET name = ?, slug = ?, short_description = ?, description = ?, image = ?, category = ?,
            material = ?, height = ?, shape = ?, finish = ?, applications_json = ?,
            customization_json = ?, moq = ?, specifications_json = ?
        WHERE id = ?
      `,
      [
        name.trim(),
        slug.trim(),
        shortDescription.trim(),
        description.trim(),
        image.trim(),
        category.trim(),
        material.trim(),
        height.trim(),
        shape.trim(),
        finish.trim(),
        JSON.stringify(applications),
        JSON.stringify(customization),
        moq.trim(),
        JSON.stringify(specifications),
        req.params.id,
      ],
    );

    await connection.query("DELETE FROM product_gallery WHERE product_id = ?", [req.params.id]);

    for (const [index, imageUrl] of galleryImages.entries()) {
      if (String(imageUrl).trim()) {
        await connection.query(
          "INSERT INTO product_gallery (product_id, image_url, sort_order) VALUES (?, ?, ?)",
          [req.params.id, String(imageUrl).trim(), index],
        );
      }
    }

    await connection.commit();
    const products = await fetchProducts();
    const updated = products.find((item) => item.id === String(req.params.id));
    return res.json(updated);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    const statusCode = error?.code === "ER_DUP_ENTRY" ? 400 : 500;
    return res.status(statusCode).json({ message: getDatabaseErrorMessage(error, "product", "Slug") });
  } finally {
    connection.release();
  }
});

app.delete("/api/admin/products/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

app.post("/api/admin/gallery", authMiddleware, async (req, res) => {
  try {
    const { title, description = "", imageUrl = "", sortOrder = 0 } = req.body;

    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const [result] = await pool.query(
      "INSERT INTO site_gallery (title, description, image_url, sort_order) VALUES (?, ?, ?, ?)",
      [String(title).trim(), String(description).trim(), String(imageUrl).trim(), Number(sortOrder) || 0],
    );

    const [rows] = await pool.query("SELECT * FROM site_gallery WHERE id = ?", [result.insertId]);
    return res.status(201).json(normalizeSiteGalleryItem(rows[0]));
  } catch (error) {
    console.error(error);
    const statusCode = error?.code === "ER_DUP_ENTRY" ? 400 : 500;
    return res.status(statusCode).json({ message: getDatabaseErrorMessage(error, "gallery item", "Title") });
  }
});

app.put("/api/admin/gallery/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description = "", imageUrl = "", sortOrder = 0 } = req.body;

    if (!String(title || "").trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const [result] = await pool.query(
      "UPDATE site_gallery SET title = ?, description = ?, image_url = ?, sort_order = ? WHERE id = ?",
      [String(title).trim(), String(description).trim(), String(imageUrl).trim(), Number(sortOrder) || 0, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    const [rows] = await pool.query("SELECT * FROM site_gallery WHERE id = ?", [req.params.id]);
    return res.json(normalizeSiteGalleryItem(rows[0]));
  } catch (error) {
    console.error(error);
    const statusCode = error?.code === "ER_DUP_ENTRY" ? 400 : 500;
    return res.status(statusCode).json({ message: getDatabaseErrorMessage(error, "gallery item", "Title") });
  }
});

app.delete("/api/admin/gallery/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM site_gallery WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete gallery item" });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });

app.use((error, req, res, _next) => {
  console.error("Unhandled API error", error);

  if (req.originalUrl?.startsWith("/api/")) {
    return res.status(error?.status || 500).json({
      message: error?.message || "Internal server error",
    });
  }

  return res.status(error?.status || 500).send(error?.message || "Internal server error");
});
