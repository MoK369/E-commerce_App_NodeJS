import { EventEmitter } from "node:events";
import CustomEvents from "./custom.event";
import { EmailEventsEnum } from "src/common/enums";
import { IEmailPayload } from "src/common/interfaces";
import { BadRequestException } from "@nestjs/common";
import sendEmail from "../email/send.email";
import HTML_EMAIL_TEMPLATE from "../email/templates/html_email.template";

const emailEvent = new CustomEvents<EmailEventsEnum, IEmailPayload>(
  new EventEmitter()
);

emailEvent.subscribe({
  eventName: EmailEventsEnum.confirmEmail,
  backgroundFunction: async (payload) => {
    if (!payload.otp) {
      throw new BadRequestException("OTP is not provided");
    }
    const subject = "Email Verification";
    await sendEmail({
      data: {
        subject,
        to: payload.to,
        html: HTML_EMAIL_TEMPLATE({
          title: subject,
          message:
            "Thank you for signing up ❤️, please use the otp below to verify your email",
          otpOrLink: payload.otp,
        }),
      },
    });
  },
});

emailEvent.subscribe({
  eventName: EmailEventsEnum.forgetPassword,
  backgroundFunction: async (payload) => {
    if (!payload.otp) {
      throw new BadRequestException("OTP is not provided");
    }
    const subject = "Forget Password";
    await sendEmail({
      data: {
        subject,
        to: payload.to,
        html: HTML_EMAIL_TEMPLATE({
          title: subject,
          message:
            "Thank you for Using Our App ❤️, please use the otp below to verify Forget Password",
          otpOrLink: payload.otp,
        }),
      },
    });
  },
});

export default emailEvent;
