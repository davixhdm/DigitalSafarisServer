import mongoose from "mongoose";

const brandingSchema = new mongoose.Schema(
  {
    logo: { type: String, default: null },
    logoUrl: { type: String, default: null },
    favicon: { type: String, default: null },
    emailHeaderLogo: { type: String, default: null },
    primaryColor: { type: String, default: "#0A1D37" },
    secondaryColor: { type: String, default: "#C59B45" },
    fontFamily: { type: String, default: "Montserrat" },
    metaTitle: { type: String, default: "Digital Safaris" },
    metaDescription: { type: String, default: "Your concierge, reimagined." },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

const Branding = mongoose.model("Branding", brandingSchema);

export default Branding;