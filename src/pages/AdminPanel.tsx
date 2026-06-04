import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Images, LogOut, PackagePlus, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductFormValues, SiteGalleryFormValues, SiteGalleryItem } from "@/types/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { resolveLegacyImage } from "@/data/legacyMedia";
import { ADMIN_LOGIN_PATH } from "@/lib/routes";
import {
  clearAdminToken,
  createGalleryItem,
  createProduct,
  deleteGalleryItem,
  deleteProduct,
  fetchAdminGalleryItems,
  fetchAdminProducts,
  getAdminToken,
  updateGalleryItem,
  updateProduct,
  uploadImage,
} from "@/lib/productApi";

type EditableSpecification = {
  id: string;
  key: string;
  value: string;
};

type EditableGalleryImage = {
  id: string;
  url: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptySpecification = (): EditableSpecification => ({
  id: createId(),
  key: "",
  value: "",
});

const createEmptyGalleryImage = (): EditableGalleryImage => ({
  id: createId(),
  url: "",
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  image: "",
  category: "",
  material: "",
  height: "",
  shape: "",
  finish: "",
  applications: [""],
  customization: [""],
  moq: "",
  specifications: {},
  galleryImages: [],
};

const emptyGalleryForm: SiteGalleryFormValues = {
  title: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
};

const toProductFormValues = (product?: Product | null): ProductFormValues => ({
  name: product?.name ?? "",
  slug: product?.slug ?? "",
  shortDescription: product?.shortDescription ?? "",
  description: product?.description ?? "",
  image: product?.image ?? "",
  category: product?.category ?? "",
  material: product?.material ?? "",
  height: product?.height ?? "",
  shape: product?.shape ?? "",
  finish: product?.finish ?? "",
  applications: product?.applications?.length ? product.applications : [""],
  customization: product?.customization?.length ? product.customization : [""],
  moq: product?.moq ?? "",
  specifications: product?.specifications ?? {},
  galleryImages: product?.galleryImages ?? [],
});

const toGalleryFormValues = (item?: SiteGalleryItem | null): SiteGalleryFormValues => ({
  title: item?.title ?? "",
  description: item?.description ?? "",
  imageUrl: item?.imageUrl ?? "",
  sortOrder: item?.sortOrder ?? 0,
});

const createSpecificationsFromProduct = (product?: Product | null) => {
  const entries = Object.entries(product?.specifications ?? {});
  return entries.length
    ? entries.map(([key, value]) => ({ id: createId(), key, value }))
    : [createEmptySpecification()];
};

const createGalleryImagesFromProduct = (product?: Product | null) => {
  const images = product?.galleryImages ?? [];
  return images.length ? images.map((url) => ({ id: createId(), url })) : [createEmptyGalleryImage()];
};

const normalizeList = (value: string[]) => value.map((item) => item.trim()).filter(Boolean);

const normalizeSpecifications = (value: EditableSpecification[]) =>
  value.reduce<Record<string, string>>((acc, item) => {
    const key = item.key.trim();
    const itemValue = item.value.trim();

    if (key && itemValue) {
      acc[key] = itemValue;
    }

    return acc;
  }, {});

const normalizeGalleryImages = (value: EditableGalleryImage[]) => value.map((item) => item.url.trim()).filter(Boolean);

const validateProductForm = (
  productForm: ProductFormValues,
  specifications: EditableSpecification[],
  galleryImages: EditableGalleryImage[],
) => {
  const requiredTextFields: Array<[string, string]> = [
    ["Product name", productForm.name],
    ["Slug", productForm.slug],
    ["Short description", productForm.shortDescription],
    ["Full description", productForm.description],
    ["Main product image", productForm.image],
    ["Category", productForm.category],
    ["Material", productForm.material],
    ["Height range", productForm.height],
    ["Shape", productForm.shape],
    ["Finish", productForm.finish],
    ["MOQ", productForm.moq],
  ];

  for (const [label, value] of requiredTextFields) {
    if (!String(value || "").trim()) {
      return `${label} is required`;
    }
  }

  if (normalizeList(productForm.applications).length === 0) {
    return "Add at least one application";
  }

  if (normalizeList(productForm.customization).length === 0) {
    return "Add at least one customization option";
  }

  if (Object.keys(normalizeSpecifications(specifications)).length === 0) {
    return "Add at least one specification";
  }

  if (normalizeGalleryImages(galleryImages).length === 0) {
    return "Add at least one detailed page image";
  }

  return null;
};

const validateGalleryForm = (siteGalleryForm: SiteGalleryFormValues) => {
  if (!String(siteGalleryForm.imageUrl || "").trim()) {
    return "Gallery image is required";
  }

  return null;
};

const createGalleryPayload = (
  siteGalleryForm: SiteGalleryFormValues,
  galleryItems: SiteGalleryItem[],
  selectedGalleryItem: SiteGalleryItem | null,
): SiteGalleryFormValues => {
  const existingTitle = String(siteGalleryForm.title || "").trim();
  const existingDescription = String(siteGalleryForm.description || "").trim();
  const imageUrl = String(siteGalleryForm.imageUrl || "").trim();
  const imageName = imageUrl.split("/").pop()?.split("?")[0] || "gallery-image";
  const fallbackIndex = galleryItems.length + 1;

  return {
    title: existingTitle || `Gallery Image ${fallbackIndex}`,
    description: existingDescription || imageName,
    imageUrl,
    sortOrder: selectedGalleryItem ? Number(siteGalleryForm.sortOrder) || 0 : galleryItems.length,
  };
};

const SectionHeading = ({ title, description }: { title: string; description: string }) => (
  <div className="md:col-span-2">
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  </div>
);

const AdminPanel = () => {
  const token = getAdminToken();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<SiteGalleryItem | null>(null);
  const [productForm, setProductForm] = useState<ProductFormValues>(emptyProductForm);
  const [productSpecifications, setProductSpecifications] = useState<EditableSpecification[]>([createEmptySpecification()]);
  const [productGalleryImages, setProductGalleryImages] = useState<EditableGalleryImage[]>([createEmptyGalleryImage()]);
  const [siteGalleryForm, setSiteGalleryForm] = useState<SiteGalleryFormValues>(emptyGalleryForm);
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [activeSection, setActiveSection] = useState<"products" | "gallery">("products");
  const mainImageInputRef = useRef<HTMLInputElement | null>(null);
  const carouselImageInputRef = useRef<HTMLInputElement | null>(null);
  const siteGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAdminProducts,
    enabled: Boolean(token),
  });

  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["admin-gallery-items"],
    queryFn: fetchAdminGalleryItems,
    enabled: Boolean(token),
  });

  const safeProducts = products.filter((item): item is Product => Boolean(item && item.id && item.name));
  const safeGalleryItems = galleryItems.filter((item): item is SiteGalleryItem => Boolean(item && item.id && item.title));

  useEffect(() => {
    setProductForm(toProductFormValues(selectedProduct));
    setProductSpecifications(createSpecificationsFromProduct(selectedProduct));
    setProductGalleryImages(createGalleryImagesFromProduct(selectedProduct));
    setSlugEditedManually(Boolean(selectedProduct?.slug));
  }, [selectedProduct]);

  useEffect(() => {
    setSiteGalleryForm(toGalleryFormValues(selectedGalleryItem));
  }, [selectedGalleryItem]);

  const productCountLabel = useMemo(() => `${safeProducts.length} product${safeProducts.length === 1 ? "" : "s"}`, [safeProducts.length]);
  const galleryCountLabel = useMemo(() => `${safeGalleryItems.length} item${safeGalleryItems.length === 1 ? "" : "s"}`, [safeGalleryItems.length]);

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
    queryClient.invalidateQueries({ queryKey: ["admin-gallery-items"] });
  };

  const saveProductMutation = useMutation({
    mutationFn: async (payload: ProductFormValues) => {
      if (selectedProduct) {
        return updateProduct(selectedProduct.id, payload);
      }
      return createProduct(payload);
    },
    onSuccess: () => {
      toast.success(selectedProduct ? "Product updated" : "Product created");
      invalidateData();
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product removed");
      invalidateData();
      setSelectedProduct(null);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete product");
    },
  });

  const saveGalleryMutation = useMutation({
    mutationFn: async (payload: SiteGalleryFormValues) => {
      if (selectedGalleryItem) {
        return updateGalleryItem(selectedGalleryItem.id, payload);
      }
      return createGalleryItem(payload);
    },
    onSuccess: () => {
      toast.success(selectedGalleryItem ? "Gallery item updated" : "Gallery item created");
      invalidateData();
      setSelectedGalleryItem(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save gallery item");
    },
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: deleteGalleryItem,
    onSuccess: () => {
      toast.success("Gallery item removed");
      invalidateData();
      setSelectedGalleryItem(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete gallery item");
    },
  });

  if (!token) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  }

  const handleProductFieldChange = (field: keyof ProductFormValues, value: string | string[]) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const handleGalleryFieldChange = (field: keyof SiteGalleryFormValues, value: string | number) => {
    setSiteGalleryForm((current) => ({ ...current, [field]: value }));
  };

  const handleProductNameChange = (value: string) => {
    setProductForm((current) => ({
      ...current,
      name: value,
      slug: slugEditedManually ? current.slug : slugify(value),
    }));
  };

  const handleProductSlugChange = (value: string) => {
    setSlugEditedManually(true);
    handleProductFieldChange("slug", slugify(value));
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setProductForm(emptyProductForm);
    setProductSpecifications([createEmptySpecification()]);
    setProductGalleryImages([createEmptyGalleryImage()]);
    setSlugEditedManually(false);
  };

  const resetSiteGalleryForm = () => {
    setSelectedGalleryItem(null);
    setSiteGalleryForm(emptyGalleryForm);
  };

  const handleListFieldChange = (field: "applications" | "customization", index: number, value: string) => {
    const nextValues = [...productForm[field]];
    nextValues[index] = value;
    handleProductFieldChange(field, nextValues);
  };

  const handleAddListField = (field: "applications" | "customization") => {
    handleProductFieldChange(field, [...productForm[field], ""]);
  };

  const handleRemoveListField = (field: "applications" | "customization", index: number) => {
    const nextValues = productForm[field].filter((_, itemIndex) => itemIndex !== index);
    handleProductFieldChange(field, nextValues.length ? nextValues : [""]);
  };

  const handleSpecificationChange = (id: string, field: "key" | "value", value: string) => {
    setProductSpecifications((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddSpecification = () => {
    setProductSpecifications((current) => [...current, createEmptySpecification()]);
  };

  const handleRemoveSpecification = (id: string) => {
    setProductSpecifications((current) => {
      const nextValues = current.filter((item) => item.id !== id);
      return nextValues.length ? nextValues : [createEmptySpecification()];
    });
  };

  const handleGalleryImageChange = (id: string, value: string) => {
    setProductGalleryImages((current) => current.map((item) => (item.id === id ? { ...item, url: value } : item)));
  };

  const handleAddGalleryImage = () => {
    setProductGalleryImages((current) => [...current, createEmptyGalleryImage()]);
  };

  const handleRemoveGalleryImage = (id: string) => {
    setProductGalleryImages((current) => {
      const nextValues = current.filter((item) => item.id !== id);
      return nextValues.length ? nextValues : [createEmptyGalleryImage()];
    });
  };

  const handleProductSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationMessage = validateProductForm(productForm, productSpecifications, productGalleryImages);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const normalizedSlug = slugify(productForm.slug);
    const duplicateSlug = safeProducts.find(
      (item) => item.slug.trim().toLowerCase() === normalizedSlug.toLowerCase() && item.id !== selectedProduct?.id,
    );

    if (duplicateSlug) {
      toast.error("This slug already exists. Please use a different slug.");
      return;
    }

    saveProductMutation.mutate({
      ...productForm,
      slug: normalizedSlug,
      applications: normalizeList(productForm.applications),
      customization: normalizeList(productForm.customization),
      galleryImages: normalizeGalleryImages(productGalleryImages),
      specifications: normalizeSpecifications(productSpecifications),
    });
  };

  const handleSiteGallerySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationMessage = validateGalleryForm(siteGalleryForm);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    saveGalleryMutation.mutate(createGalleryPayload(siteGalleryForm, safeGalleryItems, selectedGalleryItem));
  };

  const handleLogout = () => {
    clearAdminToken();
    queryClient.removeQueries({ queryKey: ["admin-products"] });
    queryClient.removeQueries({ queryKey: ["admin-gallery-items"] });
    toast.success("Logged out");
  };

  const requestDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) {
      return;
    }

    deleteProductMutation.mutate(productToDelete.id);
  };

  const handleUploadMainImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await uploadImage(file);
      handleProductFieldChange("image", result.url);
      toast.success("Main product image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      event.target.value = "";
    }
  };

  const handleUploadCarouselImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const result = await uploadImage(file);
          return result.url;
        }),
      );

      setProductGalleryImages((current) => {
        const existing = current.filter((item) => item.url.trim());
        return [...existing, ...uploadedUrls.map((url) => ({ id: createId(), url }))];
      });
      toast.success(`${uploadedUrls.length} detailed image${uploadedUrls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload detailed images");
    } finally {
      event.target.value = "";
    }
  };

  const handleUploadSiteGalleryImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const result = await uploadImage(file);
      handleGalleryFieldChange("imageUrl", result.url);
      toast.success("Gallery page image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload gallery image");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_28%),linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_38%,_#eef2ff_100%)] px-4 py-10 md:px-6">
      <AlertDialog open={Boolean(productToDelete)} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete
                ? `This will permanently delete "${productToDelete.name}" from the product list. This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProductMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteProductMutation.isPending}
              onClick={confirmDeleteProduct}
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 px-6 py-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.35),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_28%)]" />
          <div className="absolute -right-20 top-0 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-20 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-orange-300">Yash Industries Admin</p>
              <h1 className="mt-3 text-3xl font-heading font-black tracking-tight text-white md:text-4xl">Content Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Manage products and gallery images from one clean dashboard with quick switching between sections.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Product Control
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Gallery Control
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="self-start rounded-full border-white/15 bg-white/5 px-5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as "products" | "gallery")} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList className="h-auto rounded-full border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur">
              <TabsTrigger value="products" className="rounded-full px-5 py-2.5 font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                Product Form
              </TabsTrigger>
              <TabsTrigger value="gallery" className="rounded-full px-5 py-2.5 font-semibold data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-md">
                Gallery Images
              </TabsTrigger>
            </TabsList>

            {activeSection === "products" ? (
              <Button type="button" className="rounded-full bg-orange-500 px-5 text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] hover:bg-orange-600" onClick={resetProductForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Product
              </Button>
            ) : null}
          </div>

          <TabsContent value="products" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-xl font-heading font-black text-slate-900">
                    <span>Products</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{productCountLabel}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productsLoading ? (
                    <p className="text-sm text-slate-500">Loading products...</p>
                  ) : (
                    safeProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`rounded-2xl border p-4 transition ${
                          selectedProduct?.id === product.id
                            ? "border-orange-200 bg-[linear-gradient(135deg,_rgba(255,247,237,1),_rgba(255,255,255,1))] shadow-sm"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                        }`}
                      >
                        <button type="button" onClick={() => setSelectedProduct(product)} className="w-full text-left">
                          <p className="font-heading font-bold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                        </button>
                        <div className="mt-4 flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button type="button" size="sm" variant="destructive" disabled={deleteProductMutation.isPending} onClick={() => requestDeleteProduct(product)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-black text-slate-900">
                    <PackagePlus className="h-5 w-5 text-orange-500" />
                    {selectedProduct ? `Save ${selectedProduct.name}` : "Save Product"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProductSubmit} className="grid gap-4 md:grid-cols-2">
                <SectionHeading title="Basic Details" description="Enter the core product information first. These values drive the product card, product URL, and product detail page heading." />

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Product Name</label>
                  <Input value={productForm.name} onChange={(e) => handleProductNameChange(e.target.value)} placeholder="Octagonal Pole" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Product URL Slug</label>
                  <Input value={productForm.slug} onChange={(e) => handleProductSlugChange(e.target.value)} placeholder="octagonal-pole" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Short Description for Listings</label>
                  <Textarea
                    value={productForm.shortDescription}
                    onChange={(e) => handleProductFieldChange("shortDescription", e.target.value)}
                    rows={2}
                    placeholder="Short line shown on product listings"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Full Product Description</label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => handleProductFieldChange("description", e.target.value)}
                    rows={5}
                    placeholder="Detailed description shown on the product page"
                    required
                  />
                </div>

                <SectionHeading title="Main Image" description="Upload the hero image for the product card and product detail page." />

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Main Product Image URL</label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input value={productForm.image} onChange={(e) => handleProductFieldChange("image", e.target.value)} placeholder="Paste image URL or upload below" required />
                    <Button type="button" variant="outline" onClick={() => mainImageInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Main Image
                    </Button>
                  </div>
                  <input ref={mainImageInputRef} type="file" accept="image/*,.svg,.avif,.tif,.tiff,.ico" className="hidden" onChange={handleUploadMainImage} />
                  <p className="text-xs text-slate-500">Supports common image formats including JPG, PNG, WEBP, SVG, GIF, BMP, AVIF, ICO, and TIFF.</p>
                  {productForm.image ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={resolveLegacyImage(productForm.image)} alt="Main preview" className="h-56 w-full object-cover" />
                    </div>
                  ) : null}
                </div>

                <SectionHeading title="Specifications Summary" description="These fields appear in the main specification table on the product detail page." />

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <Input value={productForm.category} onChange={(e) => handleProductFieldChange("category", e.target.value)} placeholder="Street Light Poles" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Material</label>
                  <Input value={productForm.material} onChange={(e) => handleProductFieldChange("material", e.target.value)} placeholder="Mild Steel / High Tensile Steel" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Height Range</label>
                  <Input value={productForm.height} onChange={(e) => handleProductFieldChange("height", e.target.value)} placeholder="4m to 12m" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Shape</label>
                  <Input value={productForm.shape} onChange={(e) => handleProductFieldChange("shape", e.target.value)} placeholder="Octagonal" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Finish</label>
                  <Input value={productForm.finish} onChange={(e) => handleProductFieldChange("finish", e.target.value)} placeholder="Hot-Dip Galvanized" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">MOQ</label>
                  <Input value={productForm.moq} onChange={(e) => handleProductFieldChange("moq", e.target.value)} placeholder="50 Units" required />
                </div>

                <SectionHeading title="Applications" description="Add all use cases shown as chips on the product page." />

                <div className="space-y-3 md:col-span-2">
                  {productForm.applications.map((application, index) => (
                    <div key={`application-${index}`} className="flex gap-3">
                      <Input
                        value={application}
                        onChange={(e) => handleListFieldChange("applications", index, e.target.value)}
                        placeholder={`Application ${index + 1}`}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveListField("applications", index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => handleAddListField("applications")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Application
                  </Button>
                </div>

                <SectionHeading title="Customization Options" description="Add the bullet points shown in the customization area." />

                <div className="space-y-3 md:col-span-2">
                  {productForm.customization.map((customItem, index) => (
                    <div key={`customization-${index}`} className="flex gap-3">
                      <Input
                        value={customItem}
                        onChange={(e) => handleListFieldChange("customization", index, e.target.value)}
                        placeholder={`Customization option ${index + 1}`}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveListField("customization", index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => handleAddListField("customization")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customization Option
                  </Button>
                </div>

                <SectionHeading title="Detailed Specifications" description="Add every key and value you want to show inside the specifications card." />

                <div className="space-y-3 md:col-span-2">
                  {productSpecifications.map((specification) => (
                    <div key={specification.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <Input
                        value={specification.key}
                        onChange={(e) => handleSpecificationChange(specification.id, "key", e.target.value)}
                        placeholder="Specification label"
                      />
                      <Input
                        value={specification.value}
                        onChange={(e) => handleSpecificationChange(specification.id, "value", e.target.value)}
                        placeholder="Specification value"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveSpecification(specification.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddSpecification}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Specification
                  </Button>
                </div>

                <SectionHeading title="Detailed Page Images" description="Upload or paste all gallery images used in the product carousel." />

                <div className="space-y-3 md:col-span-2">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">You can paste URLs manually or upload multiple images at once.</p>
                    <Button type="button" variant="outline" onClick={() => carouselImageInputRef.current?.click()}>
                      <Images className="mr-2 h-4 w-4" />
                      Upload Detailed Images
                    </Button>
                  </div>
                  <input ref={carouselImageInputRef} type="file" accept="image/*,.svg,.avif,.tif,.tiff,.ico" multiple className="hidden" onChange={handleUploadCarouselImages} />

                  {productGalleryImages.map((imageItem, index) => (
                    <div key={imageItem.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Detailed Image {index + 1}</label>
                          <Input
                            value={imageItem.url}
                            onChange={(e) => handleGalleryImageChange(imageItem.id, e.target.value)}
                            placeholder="Paste image URL"
                          />
                        </div>
                        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => handleRemoveGalleryImage(imageItem.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {imageItem.url ? (
                        <img src={resolveLegacyImage(imageItem.url)} alt={`Detailed preview ${index + 1}`} className="mt-3 h-40 w-full rounded-xl object-cover" />
                      ) : null}
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={handleAddGalleryImage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Empty Image Field
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 md:col-span-2">
                  <Button type="submit" className="bg-slate-950 text-white hover:bg-slate-800" disabled={saveProductMutation.isPending}>
                    {selectedProduct ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {selectedProduct
                      ? saveProductMutation.isPending ? "Updating..." : "Update Product"
                      : saveProductMutation.isPending ? "Saving..." : "Create Product"}
                  </Button>
                  {selectedProduct ? (
                    <Button type="button" variant="destructive" disabled={deleteProductMutation.isPending} onClick={() => requestDeleteProduct(selectedProduct)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteProductMutation.isPending ? "Removing..." : "Delete Product"}
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={resetProductForm}>Reset Form</Button>
                </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-xl font-heading font-black text-slate-900">
                    <span>Gallery Images</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{galleryCountLabel}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {galleryLoading ? (
                    <p className="text-sm text-slate-500">Loading gallery items...</p>
                  ) : (
                    safeGalleryItems.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedGalleryItem(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selectedGalleryItem?.id === item.id
                            ? "border-orange-200 bg-[linear-gradient(135deg,_rgba(255,247,237,1),_rgba(255,255,255,1))] shadow-sm"
                            : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                        }`}
                      >
                        <p className="font-heading font-bold text-slate-900">Gallery Image {index + 1}</p>
                        <p className="mt-1 text-xs text-slate-500">Sort order: {item.sortOrder}</p>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-black text-slate-900">
                    <ImagePlus className="h-5 w-5 text-orange-500" />
                    {selectedGalleryItem ? "Save Gallery Image" : "Save Gallery Image"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSiteGallerySubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Gallery Image URL</label>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Input value={siteGalleryForm.imageUrl} onChange={(e) => handleGalleryFieldChange("imageUrl", e.target.value)} placeholder="Image URL or upload below" />
                    <Button type="button" variant="outline" onClick={() => siteGalleryInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                  </div>
                  <input ref={siteGalleryInputRef} type="file" accept="image/*,.svg,.avif,.tif,.tiff,.ico" className="hidden" onChange={handleUploadSiteGalleryImage} />
                  <p className="text-xs text-slate-500">Title, description, and sort order will be created automatically after you save the image.</p>
                  {siteGalleryForm.imageUrl ? <img src={siteGalleryForm.imageUrl} alt="Gallery preview" className="h-32 w-48 rounded-xl object-cover" /> : null}
                </div>

                <div className="flex flex-wrap gap-3 pt-2 md:col-span-2">
                  <Button type="submit" className="bg-slate-950 text-white hover:bg-slate-800" disabled={saveGalleryMutation.isPending}>
                    {selectedGalleryItem ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {selectedGalleryItem
                      ? saveGalleryMutation.isPending ? "Saving..." : "Save"
                      : saveGalleryMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  {selectedGalleryItem ? (
                    <Button type="button" variant="destructive" disabled={deleteGalleryMutation.isPending} onClick={() => deleteGalleryMutation.mutate(selectedGalleryItem.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteGalleryMutation.isPending ? "Removing..." : "Delete Gallery Item"}
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={resetSiteGalleryForm}>Reset Form</Button>
                </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default AdminPanel;
