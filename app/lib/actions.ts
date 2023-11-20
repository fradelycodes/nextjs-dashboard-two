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
	customerId: z.string({
		invalid_type_error: "Please select a customer",
	}),
	amount: z.coerce.number().gt(0, "Please enter an amount greater than 0"),
	status: z.enum(["pending", "paid"], {
		invalid_type_error: "Please select an invoice status",
	}),
	date: z.string(),
});

// Start Create Invoices Section
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export type State = {
	errors?: {
		customerId?: string[];
		amount?: string[];
		status?: string[];
	};
	message?: string | null;
};
export async function createInvoice(prevState: State, formData: FormData) {
	// Validate form using Zod
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});

	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing Fields. Failed to Create Invoice.",
		};
	}

	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split("T")[0];

	// Insert data into the database
	try {
		await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
	} catch (error) {
		// If a database error occurs, return a more specific error.
		return {
			message: "Database Error: Failed to Create Invoice.",
		};
	}

	// Revalidate the cache for the invoices page and redirect the user.
	revalidatePath("/dashboard/invoices");
	redirect("/dashboard/invoices");
}
// End Create Invoices Section

// Start Update Invoices Section
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
	id: string,
	prevState: State,
	formData: FormData
) {
	const validatedFields = UpdateInvoice.safeParse({
		customerId: formData.get("customerId"),
		amount: formData.get("amount"),
		status: formData.get("status"),
	});
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: "Missing Fields. Failed to Update Invoice.",
		};
	}

	const { customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	try {
		await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
	} catch (error) {
		return { message: "Database Error: Failed to Update Invoice." };
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
