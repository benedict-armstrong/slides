import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Presentation from "@/pages/Presentation";
import Share from "@/pages/Share";
import About from "@/pages/About";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:id" element={<Presentation />} />
        <Route path="/s/:id/share" element={<Share />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
