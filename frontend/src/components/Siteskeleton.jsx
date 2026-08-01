/**
 * SiteSkeleton — shown while a public site page is fetching its data.
 * Mirrors the real hero layout so the swap-in feels instant and intentional
 * rather than a blank flash. Respects prefers-reduced-motion via the
 * `motion-reduce:animate-none` utility.
 */
const Bar = ({ className = "" }) => (
  <div
    className={`rounded-lg bg-[linear-gradient(90deg,#E4E8F1_25%,#F0F2F8_37%,#E4E8F1_63%)] bg-[length:400%_100%] animate-[shimmer_1.4s_ease_infinite] motion-reduce:animate-none ${className}`}
  />
);

export default function SiteSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <style>{`@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
      <div className="flex items-center gap-3.5 px-6 h-20">
        <Bar className="w-11 h-11 !rounded-full" />
        <Bar className="w-40 h-3" />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <Bar className="w-36 h-6 !rounded-full mb-5" />
          <Bar className="w-[90%] h-11 mb-2.5" />
          <Bar className="w-[65%] h-11 mb-6" />
          <Bar className="w-[85%] h-3.5 mb-2" />
          <Bar className="w-[55%] h-3.5 mb-7" />
          <div className="flex gap-3">
            <Bar className="w-44 h-14 !rounded-full" />
            <Bar className="w-36 h-14 !rounded-full" />
          </div>
        </div>
        <Bar className="aspect-[4/5] w-full !rounded-[28px]" />
      </div>
    </div>
  );
}