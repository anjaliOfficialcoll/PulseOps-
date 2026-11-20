import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Zap,
  BellRing,
  BarChart3,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  Lock,
  Globe2,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const LandingPage: React.FC = () => {
  const { toggleDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleLaunchDemo = () => {
    toggleDemoMode(true);
    navigate('/dashboard');
  };

  const sampleMonitors = [
    { name: 'Auth Gateway (OAuth2 / OIDC)', status: 'OPERATIONAL', latency: '38ms', uptime: '99.99%', region: 'us-east-1' },
    { name: 'Stripe Settlement Webhooks', status: 'OPERATIONAL', latency: '142ms', uptime: '100.0%', region: 'eu-west-1' },
    { name: 'ElasticSearch Cluster Ingest', status: 'DEGRADED', latency: '820ms', uptime: '97.80%', region: 'us-west-2' },
    { name: 'Ledger Reconciliation Batch', status: 'DOWN', latency: 'TIMEOUT', uptime: '88.50%', region: 'ap-southeast-1' },
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-[#1E293B]">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 w-[350px] h-[250px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-medium text-indigo-300 mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>PulseOps v1.0 Enterprise Observability Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Monitor Every API. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
              Resolve Every Incident.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            One powerful distributed platform to monitor uptime, detect failures, investigate incidents, and keep your production backend services rock-solid.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <span>Start Monitoring Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLaunchDemo}
              className="px-6 py-3.5 text-base font-semibold text-cyan-300 bg-[#151E30] hover:bg-[#1A253C] border border-cyan-800/80 rounded-xl shadow-sm transition-all flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Interactive Live Monitor Preview */}
          <div className="mt-16 max-w-5xl mx-auto bg-[#151E30] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-[#1E293B] bg-[#0B1020]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400">api-fleet-monitor.pulseops.io</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Active Scheduler (Java 21 Engine)</span>
              </div>
            </div>

            <div className="p-6 divide-y divide-[#1E293B]/60">
              {sampleMonitors.map((m, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{m.name}</div>
                      <div className="text-xs text-slate-400 font-mono">Region: {m.region}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Uptime (30d)</div>
                      <div className="text-sm font-bold text-slate-200">{m.uptime}</div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className="text-xs text-slate-400">Latency</div>
                      <div className="text-sm font-mono font-semibold text-indigo-400">{m.latency}</div>
                    </div>
                    <StatusBadge status={m.status} size="sm" showPulse />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Enterprise Architecture</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for High-Scale SRE & Backend Teams
          </p>
          <p className="mt-4 text-slate-400 text-base">
            Engineered with a clean micro-service architecture, robust fault tolerance, and zero compromise on security.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-indigo-500/50 transition-all">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">High-Precision Probe Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sub-second HTTP/S health checking with Java 21 virtual threads, non-overlapping schedulers, and SSRF loopback defense.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-cyan-500/50 transition-all">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 w-fit mb-6">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Automated Incident Detection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deduplicated incident lifecycle management. Anomalies auto-promote into incidents with timeline logs and auto-resolve on recovery.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-emerald-500/50 transition-all">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">SLA & Latency Percentiles</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              P50, P95, and P99 latency percentiles dynamically computed from raw ping records, with exportable SLA compliance reports.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-amber-500/50 transition-all">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 w-fit mb-6">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Smart Alert Dispatcher</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Email, In-App, and Webhook channels with delivery state confirmation, exponential retry backoff, and idempotency guarantees.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-indigo-500/50 transition-all">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 w-fit mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Event-Driven Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Apache Kafka event streaming across monitor completions, failure alerts, and incident updates with Dead Letter Topics.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] hover:border-cyan-500/50 transition-all">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 w-fit mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Multi-Tenant RBAC & Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hard organization data isolation, BCrypt password hashing, JWT authentication, and sanitized audit trails without credential leakage.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="architecture" className="py-20 bg-[#111827]/60 border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Workflow</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">How PulseOps Protects Your APIs</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
              <div className="h-10 w-10 mx-auto rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-semibold text-slate-200 mb-1">Register Endpoints</h4>
              <p className="text-xs text-slate-400">Configure target URLs, HTTP headers, payloads, and check frequencies (30s to 10m).</p>
            </div>

            <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
              <div className="h-10 w-10 mx-auto rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-semibold text-slate-200 mb-1">Continuous Probing</h4>
              <p className="text-xs text-slate-400">Schedulers ping your services, measure DNS/TLS handshakes, and record latency percentiles.</p>
            </div>

            <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
              <div className="h-10 w-10 mx-auto rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-semibold text-slate-200 mb-1">Instant Alerting</h4>
              <p className="text-xs text-slate-400">If consecutive failures or latency spikes occur, incidents trigger with alert dispatch.</p>
            </div>

            <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
              <div className="h-10 w-10 mx-auto rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-semibold text-slate-200 mb-1">Investigate & Recover</h4>
              <p className="text-xs text-slate-400">Engineers collaborate on timeline comments, inspect logs, and confirm auto-recovery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Plans */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Plans & Pricing</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">Simple, Predictable Scaling</p>
          <p className="mt-3 text-slate-400 text-sm">Full feature access across every tier. No artificial limits on response-time metrics.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Developer Tier */}
          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Starter</h3>
              <p className="text-xs text-slate-400 mt-1">For indie developers and side projects</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever free</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Up to 10 active API monitors</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1-minute probe frequency</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Email & In-App alerts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 7-day log retention</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-2xl bg-[#151E30] border-2 border-indigo-500 relative flex flex-col justify-between shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-[11px] font-bold text-white uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Pro Team</h3>
              <p className="text-xs text-slate-400 mt-1">For growing SaaS & product engineering teams</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$49</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Up to 100 API monitors</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 30-second probe intervals</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Auto-incident triage & Slack/Webhook</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 90-day log history & P99 percentiles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> 5 team member seats (RBAC)</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-2xl bg-[#151E30] border border-[#1E293B] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">For mission-critical distributed fleets</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$199</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Unlimited monitors & projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 10-second high-density probes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Kafka event streams & dedicated DLQ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 365-day SLA compliance archive</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Custom private worker probes</li>
              </ul>
            </div>
            <Link
              to="/register"
              className="mt-8 w-full py-2.5 text-center text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1E293B] bg-[#080C18] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">PulseOps</span>
            <span className="text-xs text-slate-400 ml-2">Distributed Observability & Incident Platform</span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} PulseOps Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

