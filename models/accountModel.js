import mongoose from "mongoose";

const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
  conta: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const accountModel = mongoose.model("account", accountSchema);

export { accountModel };
