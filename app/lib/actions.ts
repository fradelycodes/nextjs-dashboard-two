"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// FormData is a type that represents the data sent from a form this needs to be before the functions are created
// For the functions to be able to use it
// Fradely's Code
const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(["pending", "paid"]),
	date: z.string(),
});

// Start Create Invoices Section
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
	const { customerId, amount, status } = CreateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	const rawFormData = {
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	};
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];
	try {
		await sql`INSERT INTO invoices (customer_id, amount, status, date) 
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
	} catch (error) {
		return {
			message: "Database error: Failed to create invoice",
		};
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}
// End Create Invoices Section

// Start Update Invoices Section
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	const amountInCents = amount * 100;
	try {
		await sql`
	UPDATE invoices
	SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
	WHERE id = ${id}
	`;
	} catch (error) {
		return {
			message: "Database error: Failed to update invoice",
		};
	}
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}
// End Update Invoices Section

// Start Delete Invoices Section
export async function deleteInvoice(id: string) {
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`;
		revalidatePath("/dashboard/invoices");
	} catch (error) {
		return {
			message: "Database error: Failed to delete invoice",
		};
	}
}
// End Delete Invoices Section
