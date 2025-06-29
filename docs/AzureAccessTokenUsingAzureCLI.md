## How to Manually Get an Azure Access Token Using Azure CLI

Use the steps below to manually retrieve an Azure access token for local testing or development.

---

### Prerequisites

- [Azure CLI installed](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Access to Command Prompt, PowerShell, or Terminal

---

### Step 1: Log in to Azure

If you're using an account with an active Azure subscription:

```bash
az login
```

If your account **does not have an active subscription**, run:

```bash
az login --allow-no-subscriptions
```

---

### Step 2: Authenticate in Browser

After running the login command, your **default browser will open**.
Sign in with your Microsoft work/school account — and that’s it! 🎉
Your session will be stored locally and used for token retrieval.

---
