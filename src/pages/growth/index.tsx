import { Button, DatePicker, Form, InputNumber, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDate, newId } from "@/lib/format";
import type { GrowthEntry } from "@/lib/types";

export default function GrowthPage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();
  const columns: ColumnsType<GrowthEntry> = [
    { title: "Date", dataIndex: "date", render: formatDate },
    { title: "Height", render: (_, entry) => (entry.heightCm ? `${entry.heightCm} cm` : "-") },
    { title: "Weight", render: (_, entry) => (entry.weightKg ? `${entry.weightKg} kg` : "-") },
    { title: "Head", render: (_, entry) => (entry.headCm ? `${entry.headCm} cm` : "-") },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("growth", entry.id)} /> },
  ];

  return (
    <AppShell title="Growth" subtitle="Log height, weight, and head circumference by day.">
      <section className="panel">
        <Typography.Title level={4}>New growth record</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await add("growth", {
              id: newId(),
              date: values.date.format("YYYY-MM-DD"),
              heightCm: values.heightCm,
              weightKg: values.weightKg,
              headCm: values.headCm,
            });
            form.resetFields();
          }}
        >
          <div className="formGrid">
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="heightCm" label="Height (cm)">
              <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="weightKg" label="Weight (kg)">
              <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="headCm" label="Head circumference (cm)">
              <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit">
            Save growth
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={[...data.growth].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())} />
      </section>
    </AppShell>
  );
}
