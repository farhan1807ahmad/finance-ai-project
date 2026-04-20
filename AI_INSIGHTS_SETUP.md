# AI Insights Setup Guide

## ✨ Features Implemented

Your finance app now has **AI-powered insights** that analyze your spending patterns and provide personalized recommendations using Claude AI!

### What AI Insights Provides:

- 📊 Overall spending assessment
- 💡 2-3 specific money-saving recommendations
- 🎯 Positive observations about your spending habits
- 📈 Real-time spending analytics
- 📉 Category breakdown and trends

---

## 🚀 Setup Instructions

### Step 1: Install OpenAI Package

Run this command in the `server` folder:

```bash
cd server
npm install openai
```

### Step 2: Get Claude API Key

1. Go to [Claude Console](https://console.anthropic.com)
2. Sign up or log in to your account
3. Navigate to **API keys**
4. Click **Create Key**
5. Copy the API key (starts with `sk-ant-`)

> **Note:** You'll need to set up billing on your Anthropic account.

### Step 3: Configure Environment Variables

Open `server/.env` and update:

```env
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-ant-YOUR_ACTUAL_API_KEY_HERE
```

Replace `sk-ant-YOUR_ACTUAL_API_KEY_HERE` with your actual Claude API key.

### Step 4: Restart the Server

Kill the running server and restart it:

```bash
npm start
```

You should see the server running without errors.

---

## 🎯 How to Use AI Insights

1. **Navigate to Insights** → Click "💡 Insights (AI)" in the sidebar
2. **View Your Analysis** → See AI-generated insights based on your expenses
3. **Summary Stats** → Review total spending, monthly spend, top category, and transaction count
4. **Refresh Insights** → Click "🔄 Refresh Insights" to regenerate analysis anytime
5. **Follow Recommendations** → Implement AI suggestions to improve your finances

---

## 📊 What AI Analyzes

The AI looks at:

- ✅ Total expenses and spending trends
- ✅ Category breakdown (which categories you spend most on)
- ✅ Monthly vs. overall spending patterns
- ✅ Average transaction size
- ✅ Top spending category

---

## 🐛 Troubleshooting

### Error: "OpenAI not configured"

**Solution:** Run `npm install openai` in the server folder

### Error: "OPENAI_API_KEY not set"

**Solution:** Add your API key to `server/.env`

### Error: "Failed to generate insights"

**Possible causes:**

- Invalid API key (check formatting: should start with `sk-ant-`)
- No billing set up on Anthropic account
- Network connectivity issues
- Rate limit exceeded

**Solution:**

- Verify your API key is correct
- Check Anthropic console for billing status
- Restart the server
- Wait a minute and try again

---

## 💰 Cost Considerations

- Claude API is **pay-as-you-go**
- Each insight generation uses minimal tokens (usually < $0.01)
- You can set usage limits in Anthropic console

---

## 🔐 Security Notes

- Never commit `.env` to git
- Keep your API key private
- Store sensitive data in environment variables only

---

## 📝 Example Insight Output

```
Overall Assessment:
Your monthly spending of ₹15,000 is moderate. You're spending primarily
on Food & Dining (₹5,000) and Transportation (₹4,500), which together
account for 63% of your spending.

Money-Saving Recommendations:
1. Your Food & Dining category is your largest expense at ₹5,000/month.
   Consider meal planning or cooking at home to reduce this by 20-30%.

2. Transportation costs are high at ₹4,500/month. Look into carpooling,
   public transit, or combining trips to save on fuel.

Positive Observation:
Great job maintaining consistent transactions! Your average transaction
size of ₹1,200 shows disciplined spending rather than impulsive purchases.
```

---

## 🎨 Customizing AI Prompts

To modify the AI analysis, edit the prompt in `server/index.js` at line ~280:

```javascript
const prompt = `Analyze this personal finance data...`;
```

You can customize what analysis the AI provides by changing this prompt.

---

## ✅ Next Steps

1. ✨ Add expenses to your app
2. 💼 Create budgets to track spending
3. 🧠 Go to Insights to get AI recommendations
4. 📊 Use insights to improve your financial habits
5. 🎯 Refine budgets based on AI suggestions

---

Happy budgeting! 🎉
