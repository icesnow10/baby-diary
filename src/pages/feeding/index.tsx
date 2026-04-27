import { Button, DatePicker, Form, Input, InputNumber, Radio, Select, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDateTime, newId } from "@/lib/format";
import type { FeedingEntry } from "@/lib/types";

export default function FeedingPage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();
  const kind = Form.useWatch("kind", form) ?? "nursing";

  const columns: ColumnsType<FeedingEntry> = [
    { title: "Time", dataIndex: "time", render: formatDateTime },
    { title: "Kind", dataIndex: "kind" },
    { title: "Details", render: (_, entry) => (entry.kind === "nursing" ? `${entry.side} breast, ${entry.durationMin ?? 0} min` : `${entry.source}, ${entry.volumeMl ?? 0} ml`) },
    { title: "Notes", dataIndex: "notes" },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("feeding", entry.id)} /> },
  ];

  return (
    <AppShell title="Feeding" subtitle="Record nursing by breast or bottle volume for breast milk and formula.">
      <section className="panel">
        <Typography.Title level={4}>New feeding</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ kind: "nursing", side: "left", source: "breastmilk" }}
          onFinish={async (values) => {
            await add("feeding", {
              id: newId(),
              time: values.time.toISOString(),
              kind: values.kind,
              side: values.kind === "nursing" ? values.side : undefined,
              durationMin: values.kind === "nursing" ? values.durationMin : undefined,
              source: values.kind === "bottle" ? values.source : undefined,
              volumeMl: values.kind === "bottle" ? values.volumeMl : undefined,
              notes: values.notes,
            });
            form.resetFields();
          }}
        >
          <div className="formGrid">
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="kind" label="Type">
              <Radio.Group optionType="button" options={[{ label: "Nursing", value: "nursing" }, { label: "Bottle", value: "bottle" }]} />
            </Form.Item>
            {kind === "nursing" ? (
              <>
                <Form.Item name="side" label="Breast" rules={[{ required: true }]}>
                  <Select options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
                </Form.Item>
                <Form.Item name="durationMin" label="Duration (min)" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item name="source" label="Bottle source" rules={[{ required: true }]}>
                  <Select options={[{ value: "breastmilk", label: "Breast milk" }, { value: "formula", label: "Formula" }]} />
                </Form.Item>
                <Form.Item name="volumeMl" label="Volume (ml)" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </>
            )}
            <Form.Item name="notes" label="Notes">
              <Input />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit">
            Save feeding
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={[...data.feeding].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())} />
      </section>
    </AppShell>
  );
}
