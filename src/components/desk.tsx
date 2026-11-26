import { KeyboardShop } from "@/components/keyboard-shop";

export function Desk({ onLeave }: { onLeave: () => void }) {
  return <KeyboardShop look="paper" onLeave={onLeave} />;
}
