import { useState } from 'react';

const initialState = {
  src_ip: '10.0.0.7',
  dst_ip: '172.16.0.12',
  src_port: 52311,
  dst_port: 445,
  protocol: 'tcp',
  bytes_sent: 9200,
  bytes_received: 500,
  duration_ms: 160,
  packets: 145,
  failed_logins: 2,
  unusual_flag: 1
};

export default function EventForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialState);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number.isNaN(Number(value)) ? value : Number(value) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <section className="panel form-panel">
      <h2>Manual Packet Score</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {Object.keys(initialState).map((key) => (
            <label key={key}>
              {key}
              <input
                name={key}
                value={form[key]}
                onChange={handleChange}
                type={typeof initialState[key] === 'number' ? 'number' : 'text'}
              />
            </label>
          ))}
        </div>
        <button disabled={loading} type="submit">{loading ? 'Scoring...' : 'Score Event'}</button>
      </form>
    </section>
  );
}
