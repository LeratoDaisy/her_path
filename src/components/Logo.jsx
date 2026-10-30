import { TrendingUp } from "lucide-react";

export default function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark" aria-hidden="true"><TrendingUp size={22} /></span>
      <span className="logo-text">HerPath</span>
    </div>
  );
}
