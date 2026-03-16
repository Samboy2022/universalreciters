

## Fix: Cloudinary Upload "Invalid Signature" Error

The edge function logs show the exact error: **"Invalid Signature. String to sign - 'folder=streams&timestamp=1773704840'"**

**Root cause**: The `resource_type` parameter is being included in the signature string, but Cloudinary does NOT expect `resource_type` as a signed parameter — it's part of the URL path, not the upload body. This causes a signature mismatch.

### Change

**`supabase/functions/cloudinary-upload/index.ts`** — Remove `resource_type` from the `paramsToSign` object. It should only be used in the URL path (which it already is via `uploadType`).

```text
// BEFORE (broken):
const paramsToSign = { timestamp };
if (folder) paramsToSign.folder = folder;
if (resource_type) paramsToSign.resource_type = resource_type;  // ← THIS IS WRONG

// AFTER (fixed):
const paramsToSign = { timestamp };
if (folder) paramsToSign.folder = folder;
// resource_type is NOT a signed param — it goes in the URL path only
```

That single line removal fixes the signature mismatch.

