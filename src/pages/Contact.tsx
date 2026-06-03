import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, Hash, Mail, MailCheck, MapPin, MapPinned, MessageCircle, PackageSearch, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import heroBg from "@/assets/breadcrunb.png";

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "178fcc01-d1f8-4434-bc79-1e7a97c88c41";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_FROM_NAME = "Yash Industries";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    product: "",
    quantity: "",
    city: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("access_key", WEB3FORMS_ACCESS_KEY);
    payload.append("subject", `New enquiry from ${form.name || "website"}`);
    payload.append("from_name", WEB3FORMS_FROM_NAME);
    payload.append("replyto", form.email);
    payload.append("name", form.name);
    payload.append("company", form.company);
    payload.append("phone", form.phone);
    payload.append("email", form.email);
    payload.append("product", form.product);
    payload.append("quantity", form.quantity);
    payload.append("city", form.city);
    payload.append("message", form.message);
    payload.append("botcheck", "");

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to send message");
      }

      toast.success("Message sent! We'll get back to you soon.");
      setForm({
        name: "",
        company: "",
        phone: "",
        email: "",
        product: "",
        quantity: "",
        city: "",
        message: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    }
  };

  return (
    <>
      <section className="relative overflow-hidden pt-48 pb-32 md:pt-32 md:pb-40">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Contact" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative container-custom px-4 pt-6 md:px-8">
          <nav className="mb-4 mt-16 font-body text-sm text-primary-foreground/60">
            <Link to="/" className="hover:text-primary-foreground">
              Home
            </Link>{" "}
            / <span className="text-primary-foreground">Contact</span>
          </nav>
          <h1 className="text-4xl font-heading font-black text-primary-foreground md:text-5xl">Contact Us</h1>
          <p className="mt-3 text-primary-foreground/70">Get in touch for quotes, inquiries, or partnerships.</p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} custom={0} className="mb-6 text-2xl font-heading font-black text-primary">
                Send Us a Message
              </motion.h2>
              <motion.form variants={fadeUp} custom={1} onSubmit={handleSubmit} className="glass-card space-y-4 rounded-xl p-8">
                <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
                <input type="hidden" name="subject" value={`New enquiry from ${form.name || "website"}`} />
                <input type="hidden" name="from_name" value={WEB3FORMS_FROM_NAME} />
                <input type="hidden" name="replyto" value={form.email} />
                <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} aria-hidden="true" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Company / Organization"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      placeholder="Phone Number"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                  </div>
                  <div className="relative">
                    <MailCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative">
                    <PackageSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      required
                      value={form.product}
                      onChange={(e) => setForm({ ...form, product: e.target.value })}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    >
                      <option value="">Select Product Interested In</option>
                      <option value="Tubular Pole">Tubular Pole</option>
                      <option value="Street Light Pole">Street Light Pole</option>
                      <option value="Octagonal Pole">Octagonal Pole</option>
                      <option value="High Mast Pole">High Mast Pole</option>
                      <option value="Decorative Lighting Pole">Decorative Lighting Pole</option>
                      <option value="Conical Pole">Conical Pole</option>
                      <option value="Custom Requirement">Custom Requirement</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Quantity Required"
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>
                    <div className="relative">
                      <MapPinned className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="City / Location"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="Your Message"
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg gradient-accent py-3.5 font-heading font-bold text-secondary-foreground transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </motion.form>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} custom={0} className="mb-6 text-2xl font-heading font-black text-primary">
                Get In Touch
              </motion.h2>
              <div className="mb-8 space-y-6">
                <motion.div variants={fadeUp} custom={1} className="flex items-start gap-4">
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                    <MapPin className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-primary">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Office :</span>{" "}
                      Shop No.02, Sai Residency Near Natyagruh Canal Road Beed 431122
                      <br />
                      <span className="font-semibold text-primary">Plant/Company add:-</span>{" "}
                      Survey No. 73, Charhata Road, Palwan, Tq. and Dist. Beed .431122
                    </p>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} custom={2} className="flex items-start gap-4">
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
                    <Phone className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-[#0B2A4A]">Phone</h3>
                    <div className="flex flex-col gap-1">
                      <a href="tel:+919673064141" className="text-sm text-muted-foreground hover:text-secondary">
                        +91 96730 64141
                      </a>
                      <a href="tel:+919559434141" className="text-sm text-muted-foreground hover:text-secondary">
                        +91 95594 34141
                      </a>
                      <a href="tel:+919049874141" className="text-sm text-muted-foreground hover:text-secondary">
                        +91 90498 74141
                      </a>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#0B2A4A]">CEO Contact No.</p>
                      <a href="tel:+919768414141" className="text-sm text-muted-foreground hover:text-secondary">
                        +91 97684 14141
                      </a>
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} custom={3} className="flex items-start gap-4">
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                    <Mail className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-primary">Email</h3>
                    <a href="mailto:yashindustriesbeed@gmail.com" className="text-sm text-muted-foreground hover:text-secondary">
                      yashindustriesbeed@gmail.com
                    </a>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} custom={4} className="flex items-start gap-4">
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]">
                    <MessageCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-primary">WhatsApp</h3>
                    <a href="https://wa.me/919673064141" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-secondary">
                      Chat with us on WhatsApp
                    </a>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={fadeUp} custom={5} className="space-y-3">
                <a
                  href="https://maps.app.goo.gl/rGvUny9DbVssZMDS6?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary/80"
                >
                  Open Company Location on Google Maps
                </a>
                <div className="h-64 overflow-hidden rounded-xl shadow-card">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.8548503436255!2d75.7226937!3d18.9820167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc52bd336dad891%3A0xe40ded7e519b7dc0!2sYash%20industries!5e0!3m2!1sen!2sin!4v1776151446251!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
