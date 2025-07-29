import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Bienvenido a tu consultor de MC impulsado por IA!",
      verificationEmailBody: (createCode) =>
        `Usa este codigo para verificar tu cuenta: ${createCode()}`,
    },
  },
});