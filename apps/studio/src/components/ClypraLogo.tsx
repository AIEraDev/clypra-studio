export function ClypraLogo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/clypra.svg"
      alt="Clypra"
      width={size}
      height={size}
      draggable={false}
      className={`select-none object-contain ${className}`}
    />
  );
}
