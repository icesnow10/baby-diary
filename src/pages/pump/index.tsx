import { Button, DatePicker, Form, Input, InputNumber, Select, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDateTime, formatDuration, newId } from "@/lib/format";
import type { PumpEntry } from "@/lib/types";

export default function PumpPage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();
  const columns: ColumnsType<PumpEntry> = [
    { title: "Start", dataIndex: "start", render: formatDateTime },
    { title: "Finish", dataIndex: "finish", render: formatDateTime },
    { title: "Side", dataIndex: "side" },
    { title: "Duration", render: (_, entry) => formatDuration(entry.start, entry.finish) },
    { title: "Volume", render: (_, entry) => (entry.volumeMl ? `${entry.volumeMl} ml` : "-") },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("pump", entry.id)} /> },
  ];

  return (
    <AppShell title="Pumping" subtitle="Track pumping sessions by left or right breast.">
      <section className="panel">
        <Typography.Title level={4}>New pumping session</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ side: "left" }}
          onFinish={async (values) => {
            await add("pump", {
              id: newId(),
              side: values.side,
              start: values.start.toISOString(),
              finish: values.finish.toISOString(),
              volumeMl: values.volumeMl,
              notes: values.notes,
            });
            form.resetFields();
          }}
        >
          <div className="formGrid">
            <Form.Item name="start" label="Start time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="finish" label="Finish time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="side" label="Breast">
              <Select options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
            </Form.Item>
            <Form.Item name="volumeMl" label="Volume (ml)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit">
            Save pumping
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={[...data.pump].sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())} />
      </section>
    </AppShell>
  );
}
