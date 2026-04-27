import { Button, DatePicker, Form, Input, Radio, Select, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import AppShell from "@/components/AppShell";
import DeleteButton from "@/components/DeleteButton";
import { useData } from "@/context/DataContext";
import { formatDateTime, newId } from "@/lib/format";
import type { DiaperEntry } from "@/lib/types";

export default function DiaperPage() {
  const { data, add, remove } = useData();
  const [form] = Form.useForm();
  const columns: ColumnsType<DiaperEntry> = [
    { title: "Time", dataIndex: "time", render: formatDateTime },
    { title: "Type", dataIndex: "type" },
    { title: "Cream", dataIndex: "cream", render: (value) => value ?? "-" },
    { title: "Notes", dataIndex: "notes" },
    { title: "", width: 64, render: (_, entry) => <DeleteButton onConfirm={() => remove("diaper", entry.id)} /> },
  ];

  return (
    <AppShell title="Diapers" subtitle="Track diaper type, timing, and cream use.">
      <section className="panel">
        <Typography.Title level={4}>New diaper change</Typography.Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: "wet" }}
          onFinish={async (values) => {
            await add("diaper", { id: newId(), time: values.time.toISOString(), type: values.type, cream: values.cream, notes: values.notes });
            form.resetFields();
          }}
        >
          <div className="formGrid">
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="type" label="Type">
              <Radio.Group optionType="button" options={[{ label: "Wet", value: "wet" }, { label: "Dirty", value: "dirty" }, { label: "Mix", value: "mix" }, { label: "Dry", value: "dry" }]} />
            </Form.Item>
            <Form.Item name="cream" label="Diaper cream">
              <Select allowClear options={[{ value: "assadura", label: "Assadura" }, { value: "hipoglos", label: "Hipoglos" }]} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit">
            Save diaper
          </Button>
        </Form>
      </section>
      <section className="panel">
        <Typography.Title level={4}>History</Typography.Title>
        <Table rowKey="id" columns={columns} dataSource={[...data.diaper].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())} />
      </section>
    </AppShell>
  );
}
