import { google } from "googleapis";
import Stripe from "stripe";

export default async function handler(req, res) {
	if (req.method === "POST") {
		try {
      const event = req.body;
      
      const sessionId = event.id;

      const stripe = new Stripe(process.env.STRIPE_API_KEY, {
        apiVersion: '2023-08-16',
      });

      // Retrieve the session from Stripe
      const data = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      });

			if (data.line_items.data[0].price.lookup_key !== "tryout_payment_2024") {
				console.log("Checkout Session did not match criteria.");
				res.status(200).json({ success: true, filtered: true });
				return;
			}

			const playerFirstName = data.custom_fields[0].text.value.trim();
			const playerLastName = data.custom_fields[1].text.value.trim();
			const email = data.customer_details.email;
			const teamTryingOutFor = data.custom_fields[2].dropdown.value.trim().toUpperCase();

			// Date formatting
			let date = new Date();
			let mm = date.getMonth() + 1;
			let dd = date.getDate();
			let yyyy = date.getFullYear();

			if (dd < 10) dd = "0" + dd;
			if (mm < 10) mm = "0" + mm;

			date = mm + "-" + dd + "-" + yyyy;

			console.log("--- Found Data ---");
			console.log(`First Name: ${playerFirstName}`);
			console.log(`Last Name: ${playerLastName}`);
			console.log(`Email: ${email}`);
			console.log(`Team Trying Out For: ${teamTryingOutFor}`);
			console.log(`Date: ${date}`);

			// Authenticate with Google Sheets API
			const auth = new google.auth.GoogleAuth({
				credentials: {
					client_email: process.env.GOOGLE_CLIENT_EMAIL,
					private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
				},
				scopes: ["https://www.googleapis.com/auth/spreadsheets"],
			});

			const sheets = google.sheets({ version: "v4", auth });

			// ID of the Google Sheet and the range where data will be written
			const spreadsheetId = process.env.SPREADSHEET_ID;
			const range = "Sheet1!A1:E1";

			// Prepare the data to write
			const values = [[date, playerFirstName, playerLastName, email, teamTryingOutFor]];

			// Write data to the Google Sheet
			await sheets.spreadsheets.values.append({
				spreadsheetId,
				range,
				valueInputOption: "RAW",
				resource: { values },
			});

			res.status(200).json({ success: true, filtered: false });
		} catch (error) {
			console.error("Error handling webhook:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	} else {
		res.setHeader("Allow", ["POST"]);
		res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}
