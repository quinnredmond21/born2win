export default function Logo({ size = "md" }: { size?: "md" | "lg"; width?: number; height?: number }) {
  const fontSize = size === "lg" ? "4.5rem" : "1.6rem";
  return (
    <span
      style={{
        fontFamily: "var(--font-dancing), 'Brush Script MT', cursive",
        fontWeight: 700,
        fontSize,
        color: "#45D4E8",
        lineHeight: 1,
      }}
    >
      Born 2 Win
    </span>
  );
}
