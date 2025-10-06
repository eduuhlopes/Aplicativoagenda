// @ts-nocheck
// This file uses the globally available 'emailjs' object from the CDN script.

// TODO: Replace with your actual EmailJS credentials from your account dashboard.
const SERVICE_ID = 'YOUR_SERVICE_ID';
const TEMPLATE_ID_APPOINTMENT_CONFIRMATION = 'YOUR_APPOINTMENT_TEMPLATE_ID';
const TEMPLATE_ID_REQUEST_CONFIRMATION = 'YOUR_REQUEST_CONFIRMATION_TEMPLATE_ID';
const TEMPLATE_ID_ADMIN_NOTIFICATION = 'YOUR_ADMIN_NOTIFICATION_TEMPLATE_ID';
// TODO: Set the email address where you want to receive admin notifications.
const ADMIN_EMAIL = 'admin@example.com'; 

/*
  Your EmailJS templates should use the following variables:
  - {{client_name}}
  - {{client_email}}
  - {{client_phone}}
  - {{appointment_date}}
  - {{appointment_time}}
  - {{professional_name}}
  - {{services_list}}
  - {{total_value}}
  - {{reply_to}} (use this in the "Reply-To" field in your template settings)
  - {{to_email}} (for admin notifications)
*/

export interface TemplateParams {
    client_name: string;
    client_email: string;
    client_phone: string;
    appointment_date: string;
    appointment_time: string;
    professional_name: string;
    services_list: string;
    total_value: string;
    reply_to?: string;
    to_email?: string;
}

const sendEmail = (templateId: string, params: TemplateParams): Promise<void> => {
    return new Promise((resolve, reject) => {
        emailjs.send(SERVICE_ID, templateId, params)
            .then((response) => {
                console.log('EMAIL SUCCESS!', response.status, response.text);
                resolve();
            }, (error) => {
                console.error('EMAIL FAILED...', error);
                reject(error);
            });
    });
};

export const sendAppointmentConfirmationEmail = (params: TemplateParams) => {
    return sendEmail(TEMPLATE_ID_APPOINTMENT_CONFIRMATION, { ...params, reply_to: params.client_email });
};

export const sendBookingRequestClientEmail = (params: TemplateParams) => {
    return sendEmail(TEMPLATE_ID_REQUEST_CONFIRMATION, { ...params, reply_to: ADMIN_EMAIL });
};

export const sendBookingRequestAdminEmail = (params: TemplateParams) => {
    // Admin notification is sent to the configured admin email
    return sendEmail(TEMPLATE_ID_ADMIN_NOTIFICATION, { ...params, to_email: ADMIN_EMAIL, reply_to: params.client_email });
};
