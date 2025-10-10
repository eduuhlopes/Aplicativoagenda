// @ts-nocheck
// This file uses the globally available 'emailjs' object from the CDN script.

// --- ATENÇÃO: Configure suas credenciais do EmailJS abaixo ---
// Acesse seu painel em https://dashboard.emailjs.com/ para obter estes valores.

// 1. Service ID obtido de "Email Services".
const SERVICE_ID = 'service_m7lhjom'; 

// 2. Vá em "Email Templates", copie o ID de cada template e cole abaixo.
//    O ID é um código, não o nome do template (ex: template_ab12cde).
const TEMPLATE_ID_APPOINTMENT_CONFIRMATION = 'template_rj9xx0r'; // OK! Este é o ID para o template "Danny Lopes".
// FIX: Replace placeholder template IDs with more realistic defaults.
const TEMPLATE_ID_REQUEST_CONFIRMATION = 'template_request_confirmation';     // Para o email automático que a cliente recebe ao solicitar.
const TEMPLATE_ID_ADMIN_NOTIFICATION = 'template_admin_notification';         // Para notificar o salão sobre a nova solicitação.

// 3. Defina o email que receberá as notificações de novos agendamentos.
// FIX: Replace placeholder admin email with a more realistic default.
const ADMIN_EMAIL = 'dani.lopes.unhas@gmail.com'; // SUBSTITUA PELO SEU EMAIL DE ADMIN

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
        // Verifica se os IDs foram substituídos para evitar erros
        if (SERVICE_ID.includes('xxxx') || templateId.includes('SEU_TEMPLATE')) {
            const errorMessage = "EmailJS não configurado. Verifique SERVICE_ID e TEMPLATE_IDs em utils/emailService.ts";
            console.error(errorMessage);
            return reject(new Error(errorMessage));
        }
        
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
