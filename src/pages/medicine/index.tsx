import { Button, DatePicker, Form, Input, InputNumber, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDateTime, newId } from "@/lib/format";
import type { MedicineEntry } from "@/lib/types";

export default function MedicinePage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();
  const columns: ColumnsType<MedicineEntry> = [
    { title: "Time", dataIndex: "time", render: formatDateTime },
    {
      title: "Medication",
      render: (_, entry) =>
        entry.doses
          .map((dose) => `${dose.name}${dose.amount ? ` ${dose.amount} ${dose.unit ?? ""}` : ""}`)
          .join(", "),
    },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("medicine", entry.id)} /> },
  ];

  return (
    <AppShell title="Medicine" subtitle="Record one or multiple medicines at the same time.">
      <section className="panel">
        <Typography.Title level={4}>New medicine entry</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ doses: [{ unit: "ml" }] }}
          onFinish={async (values) => {
            await add("medicine", { id: newId(), time: values.time.toISOString(), doses: values.doses });
            form.resetFields();
          }}
        >
          <Form.Item name="time" label="Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.List name="doses">
            {(fields, { add: addDose, remove: removeDose }) => (
              <Space direction="vertical" style={{ width: "100%" }}>
                {fields.map((field) => (
                  <div className="formGrid compact" key={field.key}>
                    <Form.Item {...field} name={[field.name, "name"]} label="Medication" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, "amount"]} label="Amount" rules={[{ required: true }]}>
                      <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, "unit"]} label="Unit" rules={[{ required: true }]}>
                      <Select options={[{ value: "ml", label: "ml" }, { value: "drops", label: "drops" }, { value: "tsp", label: "tsp" }]} />
                    </Form.Item>
                    <Button danger onClick={() => removeDose(field.name)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button icon={<Plus size={16} />} onClick={() => addDose({ unit: "ml" })}>
                  Add medication
                </Button>
              </Space>
            )}
          </Form.List>
          <Button type="primary" htmlType="submit">
            Save medicine
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={[...data.medicine].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())} />
      </section>
    </AppShell>
  );
}
