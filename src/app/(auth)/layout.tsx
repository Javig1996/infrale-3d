export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "#070D16",
        backgroundImage: `
          radial-gradient(ellipse 120% 60% at 30% 50%, rgba(14,77,164,0.14) 0%, transparent 65%),
          radial-gradient(ellipse 80% 80% at 80% 80%, rgba(6,182,212,0.05) 0%, transparent 55%)
        `,
      }}
    >
      {/* Grid sutil de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundSize: "44px 44px",
          backgroundImage: `
            linear-gradient(rgba(37,57,79,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,57,79,0.12) 1px, transparent 1px)
          `,
        }}
      />
      {/* Orbes de profundidad */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", top: "-10%", left: "15%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(14,77,164,0.12) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "10%",
          width: 350, height: 350,
          background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {children}
      </div>
    </div>
  );
}
