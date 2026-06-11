export async function extractErrorMessage(error) {
  if (error.response?.data instanceof Blob) {
    const text = await error.response.data.text();
    try {
      return JSON.parse(text).message;
    } catch {
      return "Failed to Generate PDF";
    }
  }
  return error?.response?.data?.message || "Failed to Generate PDF";
}
