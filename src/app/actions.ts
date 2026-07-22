"use server";

const STATIC_DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100' style='background:%23050110;'><rect width='100' height='100' fill='%23050110' stroke='%2300d2ff' stroke-width='1'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2300d2ff' font-family='monospace' font-size='5'>NUEVO PRODUCTO</text></svg>";

export async function fetchInventory() {
  console.log("[SERVER ACTION] fetchInventory llamado (simulado)");
  return [];
}

export async function saveProduct(product: any) {
  console.log("[SERVER ACTION] Guardando/Actualizando producto:", product?.name);
  try {
    const { id, ...rest } = product;
    const finalImageUrl = rest.image_url || STATIC_DEFAULT_IMAGE;
    
    let finalExtras: string[] = [];
    if (rest.images_extras) {
      if (Array.isArray(rest.images_extras)) {
        finalExtras = rest.images_extras;
      } else if (typeof rest.images_extras === 'string') {
        try {
          finalExtras = JSON.parse(rest.images_extras);
        } catch {
          finalExtras = rest.images_extras.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");
        }
      }
    }

    const mockProduct = {
      ...rest,
      id: id ? Number(id) : Math.floor(Math.random() * 100000),
      image_url: finalImageUrl,
      images_extras: finalExtras,
      stock: Number(rest.stock) || 0,
      price: Number(rest.price) || 0
    };

    return { success: true, product: mockProduct, error: null };
  } catch (err: any) {
    console.error("[SERVER ACTION] Error en saveProduct:", err);
    return { success: false, product: null, error: err.message };
  }
}

export async function deleteProduct(id: number | string) {
  console.log(`\n============================`);
  console.log(`[SERVER ACTION] Petición para eliminar producto ID: ${id}`);
  console.log(`============================`);

  try {
    if (!id) {
      console.log("[SERVER ACTION] ❌ Error: Se recibió un ID inválido.");
      return { success: false, error: "El ID provisto no es válido para la remoción." };
    }

    console.log(`[SERVER ACTION] ✅ Autorización de borrado concedida para el ID: ${id}`);
    return { success: true };
  } catch (err: any) {
    console.error("[SERVER ACTION] 🔥 Error en deleteProduct:", err);
    return { success: false, error: err.message };
  }
}

export async function fetchVentas() {
  console.log("[SERVER ACTION] fetchVentas llamado (simulado)");
  return [];
}

export async function registrarVenta(ventaData: any) {
  console.log("[SERVER ACTION] Registrando nueva venta:", ventaData?.cliente_email);
  try {
    return { success: true, data: ventaData };
  } catch (err: any) {
    console.error("[SERVER ACTION] Error en registrarVenta:", err);
    return { success: false, error: err.message };
  }
}

export async function processStockUpdate(cartItems: any[]) {
  console.log("[SERVER ACTION] Procesando descuento de stock para", cartItems?.length, "items");
  try {
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error en processStockUpdate:", error);
    return { success: false, error: error.message };
  }
}

export async function handleAuthDB(email: string, isLogin: boolean) {
  console.log(`[SERVER ACTION] Autenticación simulada para: ${email} (Login: ${isLogin})`);
  return { success: true, user: { email, id: 1 } };
}