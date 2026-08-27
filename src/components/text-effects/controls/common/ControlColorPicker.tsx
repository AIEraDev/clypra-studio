import { ClypraColorPicker } from "@clypra/ui-color-picker";

export function ControlColorPicker({
  value,
  onChange,
  size = "sm",
  className = "w-7 h-7",
}: {
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const safe = value?.startsWith("#") ? value : "#ffffff";
  return (
    <ClypraColorPicker
      value={safe}
      onChange={onChange}
      onChangeComplete={onChange}
      size={size}
      placement="left-start"
      triggerClassName={`rounded border border-white/10 shrink-0 ${className}`}
    />
  );
}
