"use client";

import { useEffect, useState } from "react";

type Subscriber = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  orderCount: number;
  active: boolean;
  createdAt: string;
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/subscribers");

        if (!res.ok) throw new Error("Could not load the mailing list");

        setSubscribers(await res.json());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const active = subscribers.filter((subscriber) => subscriber.active);
  const repeat = subscribers.filter((subscriber) => subscriber.orderCount > 1);

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(
        active.map((subscriber) => subscriber.email).join(", ")
      );

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — your browser blocked clipboard access");
    }
  }

  // Built in the browser rather than as an endpoint: the list is already here
  // and a few thousand rows of CSV is nothing to assemble.
  function downloadCsv() {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const rows = [
      ["Email", "Name", "Phone", "Orders", "Joined"],
      ...subscribers.map((subscriber) => [
        subscriber.email,
        subscriber.name ?? "",
        subscriber.phone ?? "",
        String(subscriber.orderCount),
        new Date(subscriber.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = `novacart-subscribers-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="page p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <span className="eyebrow">NovaCart Admin</span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2">
              📬 Subscribers
            </h1>
            <p className="text-muted-soft mt-2">
              Everyone who has placed an order is on the list.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyEmails}
              disabled={active.length === 0}
              className="btn btn-outline btn-sm"
            >
              {copied ? "✅ Copied" : "📋 Copy emails"}
            </button>

            <button
              onClick={downloadCsv}
              disabled={subscribers.length === 0}
              className="btn btn-primary btn-sm"
            >
              ⬇ Download CSV
            </button>
          </div>
        </div>

        {error && <div className="card p-4 mb-6 text-danger">{error}</div>}

        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: "📬 Subscribers", value: subscribers.length },
            { label: "✅ Active", value: active.length },
            { label: "🔁 Repeat buyers", value: repeat.length },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 sm:p-6">
              <h2 className="text-sm sm:text-lg font-semibold">
                {stat.label}
              </h2>
              <p className="text-2xl sm:text-4xl font-bold mt-3 text-brand-600">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="panel p-5 sm:p-8 text-center text-muted-soft text-xl">
            Loading...
          </div>
        ) : subscribers.length === 0 ? (
          <div className="panel p-5 sm:p-8 text-center text-muted-soft text-xl">
            No subscribers yet — the first order adds one.
          </div>
        ) : (
          <div className="space-y-4">
            {subscribers.map((subscriber) => (
              <div key={subscriber._id} className="card p-4 sm:p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">
                      {subscriber.name || "—"}
                    </p>

                    <p className="text-muted-soft text-sm break-words">
                      {subscriber.email}
                      {subscriber.phone ? ` · ${subscriber.phone}` : ""}
                    </p>

                    <p className="text-muted-soft text-sm mt-1">
                      Joined{" "}
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold text-xl">
                      {subscriber.orderCount}
                    </p>
                    <p className="text-muted-soft text-sm">
                      {subscriber.orderCount === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
