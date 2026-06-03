import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminToken, loginAdmin } from "@/lib/productApi";
import { ADMIN_PANEL_PATH } from "@/lib/routes";
import adminLogo from "@/assets/logo .png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (getAdminToken()) {
    return <Navigate to={ADMIN_PANEL_PATH} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await loginAdmin(username, password);
      toast.success("Admin login successful");
      navigate(ADMIN_PANEL_PATH);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_hsl(213_52%_18%)_0%,_hsl(213_52%_24%)_52%,_hsl(213_40%_22%)_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_20%)]" />
      <div className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute bottom-[-8%] right-[-6%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <Card className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.35)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(255,247,237,1),_rgba(255,255,255,1))] px-6 py-7 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-orange-100 bg-white shadow-[0_16px_40px_rgba(249,115,22,0.18)]">
                <img src={adminLogo} alt="Yash Industries" className="h-14 w-auto object-contain" />
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-700">
                <LockKeyhole className="h-3.5 w-3.5" />
                Admin Login
              </div>
              <h2 className="mt-4 text-3xl font-heading font-black tracking-tight text-slate-950">Welcome Back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Login to open the admin dashboard.</p>
            </div>

            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Username</label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-base focus-visible:border-primary focus-visible:ring-primary"
                      placeholder="Enter admin username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-base focus-visible:border-primary focus-visible:ring-primary"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,_hsl(213_52%_24%),_hsl(213_52%_32%))] text-base font-semibold text-white shadow-[0_18px_35px_rgba(30,58,95,0.24)] hover:bg-[linear-gradient(135deg,_hsl(24_94%_53%),_hsl(24_94%_60%))]"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Login"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdminLogin;
