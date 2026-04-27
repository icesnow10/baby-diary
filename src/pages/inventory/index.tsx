import { useEffect } from "react";
import { Button, Form, InputNumber, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import AppShell from "@/components/AppShell";
import { useData } from "@/context/DataContext";
import type { DiaperInventoryItem } from "@/lib/types";

export default function InventoryPage() {
  const { data, replace } = useData();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    form.setFieldsValue({ counts: data.diaperInventory.map((item) => item.count) });
  }, [data.diaperInventory, form]);

  const columns: ColumnsType<DiaperInventoryItem> = [
    { title: "Size", dataIndex: "size" },
    { title: "Count", dataIndex: "count" },
  ];

  return (
    <AppShell title="Inventory" subtitle="Keep diaper inventory by size.">
      {contextHolder}
      <section className="panel">
        <Typography.Title level={4}>Update diaper inventory</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const next = data.diaperInventory.map((item, index) => ({
              size: item.size,
              count: Number(values.counts?.[index] ?? 0),
            }));
            await replace("diaperInventory", next);
            messageApi.success("Inventory saved");
          }}
        >
          {data.diaperInventory.map((item, index) => (
            <div className="inventoryRow" key={item.size}>
              <strong>{item.size}</strong>
              <Form.Item name={["counts", index]} initialValue={item.count} style={{ margin: 0 }}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </div>
          ))}
          <Button type="primary" htmlType="submit" style={{ marginTop: 16 }}>
            Save inventory
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>Current stock</Typography.Title>
        <Table rowKey="size" columns={columns} dataSource={data.diaperInventory} pagination={false} />
      </section>
    </AppShell>
  );
}
