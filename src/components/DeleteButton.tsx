import { Button, Popconfirm } from "antd";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ onConfirm }: { onConfirm: () => void | Promise<void> }) {
  return (
    <Popconfirm title="Delete this entry?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={onConfirm}>
      <Button danger icon={<Trash2 size={16} />} />
    </Popconfirm>
  );
}
