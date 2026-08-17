import { useState } from "react";
import { motion } from "framer-motion";
import { createPaymentOrder, verifyPayment } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      // Need to login first
      navigate("/login?redirect=/pricing");
      return;
    }

    setLoading(plan);
    try {
      // 1. Create order
      const order = await createPaymentOrder(plan);

      // 2. Open Razorpay Checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "GlitchV12 Job Aggregator",
        description: `Pro Subscription (${plan})`,
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan,
            });
            alert("Subscription activated successfully! Enjoy Pro.");
            window.location.href = "/";
          } catch (err: any) {
            alert("Payment verification failed. Please contact support.");
            console.error(err);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || "9049056687", // Defaulting to user's requested number if empty
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to create order";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Supercharge your job search.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get unlimited AI resume matches, keyword insights, and priority support. Land your dream job faster.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Perfect for casual browsing.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">₹0</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem text="Unlimited job browsing" included />
              <FeatureItem text="Work mode filters" included />
              <FeatureItem text="Application tracker" included />
              <FeatureItem text="5 AI Resume Matches / day" included />
              <FeatureItem text="5 ATS Keyword Insights / day" included />
              <FeatureItem text="Priority support" included={false} />
            </ul>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
            >
              Get Started
            </button>
          </motion.div>

          {/* Pro Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col shadow-xl relative transform scale-105 z-10"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Pro Monthly</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Everything you need to land the job.</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">₹129</span>
              <span className="text-gray-500 dark:text-gray-400">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem text="Unlimited job browsing" included />
              <FeatureItem text="Work mode filters" included />
              <FeatureItem text="Application tracker" included />
              <FeatureItem text="Unlimited AI Resume Matches" included />
              <FeatureItem text="Unlimited ATS Insights" included />
              <FeatureItem text="Priority support" included />
            </ul>
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-70 flex items-center justify-center"
            >
              {loading === "monthly" ? "Processing..." : "Subscribe Monthly"}
            </button>
          </motion.div>

          {/* Pro Annual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col shadow-sm"
          >
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">Pro Annual</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Save 35% for a full year.</p>
              </div>
              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                Save 35%
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold">₹999</span>
              <span className="text-gray-500 dark:text-gray-400">/yr</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <FeatureItem text="All Pro Monthly features" included />
              <FeatureItem text="Huge discount" included />
              <FeatureItem text="Cancel anytime" included />
            </ul>
            <button
              onClick={() => handleSubscribe("annual")}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {loading === "annual" ? "Processing..." : "Subscribe Annually"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${included ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
      {included ? (
        <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {text}
    </li>
  );
}
