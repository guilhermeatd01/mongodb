import express from "express";
import { accountModel } from "../models/accountModel.js";

const router = express.Router();

router.patch("/deposito", async (req, res, next) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;
    const value = req.body.value;

    const account = await accountModel.findOneAndUpdate(
      { agencia: agencia, conta: conta },
      { $inc: { balance: value } },
      { new: true }
    );

    if (!account) throw new Error("Conta não existe");

    res.send(account);
  } catch (error) {
    next(error);
  }
});

router.patch("/saque", async (req, res, next) => {
  try {
    const agencia = req.body.agencia;
    const conta = req.body.conta;
    const value = req.body.value + 1;

    const account = await accountModel.findOneAndUpdate(
      { agencia: agencia, conta: conta, balance: { $gte: value } },
      { $inc: { balance: value * -1 } },
      { new: true }
    );

    if (!account) throw new Error("Conta não existe");

    res.send(account);
  } catch (error) {
    next(error);
  }
});

router.get("/balance/:agencia/:conta", async (req, res, next) => {
  try {
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    const account = await accountModel.findOne(
      { agencia: agencia, conta: conta },
      { balance: 1 }
    );

    if (!account) throw new Error("Conta não existe");

    res.send(account);
  } catch (error) {
    next(error);
  }
});

router.delete("/:agencia/:conta", async (req, res, next) => {
  try {
    const agencia = req.params.agencia;
    const conta = req.params.conta;

    const account = await accountModel.findOneAndDelete({
      agencia: agencia,
      conta: conta,
    });

    if (!account) throw new Error("Conta não existe");

    const totalAccounts = await accountModel.countDocuments({
      agencia: agencia,
    });

    res.send({ totalAccounts });
  } catch (error) {
    next(error);
  }
});

router.get("/transfere/:origem/:destino/:valor", async (req, res, next) => {
  try {
    const origem = req.params.origem;
    const destino = req.params.destino;
    const valor = parseInt(req.params.valor);
    let valorCobranca = valor;

    const accountOrigem = await accountModel.findOne({
      conta: origem,
    });

    const accountDestino = await accountModel.findOne({
      conta: destino,
    });

    if (accountOrigem.agencia !== accountDestino.agencia) {
      valorCobranca += 8;
    }

    if (accountOrigem.balance >= valorCobranca) {
      await accountModel.bulkWrite([
        {
          updateOne: {
            filter: { conta: origem },
            update: { $inc: { balance: valorCobranca * -1 } },
          },
        },
        {
          updateOne: {
            filter: { conta: destino },
            update: { $inc: { balance: valor } },
          },
        },
      ]);
      const saldo = await accountModel.findOne(
        { conta: origem },
        { balance: 1 }
      );
      res.send(saldo);
    } else {
      throw new Error("Saldo insuficiente");
    }
  } catch (error) {
    next(error);
  }
});

router.get("/media/:agencia", async (req, res, next) => {
  try {
    const agencia = parseInt(req.params.agencia);

    const media = await accountModel.aggregate([
      { $match: { agencia: agencia } },
      { $group: { _id: { agencia: "$agencia" }, media: { $avg: "$balance" } } },
    ]);

    res.send(media);
  } catch (error) {
    next(error);
  }
});

router.get("/pobres/:qtd", async (req, res, next) => {
  try {
    const qtd = parseInt(req.params.qtd);

    const pobres = await accountModel
      .find({}, { agencia: 1, conta: 1, balance: 1 })
      .sort({ balance: 1 })
      .limit(qtd);

    res.send(pobres);
  } catch (error) {
    next(error);
  }
});

router.get("/ricos/:qtd", async (req, res, next) => {
  try {
    const qtd = parseInt(req.params.qtd);

    const ricos = await accountModel
      .find({}, { agencia: 1, conta: 1, balance: 1, name: 1 })
      .sort({ balance: -1 })
      .limit(qtd);

    res.send(ricos);
  } catch (error) {
    next(error);
  }
});

router.get("/private", async (req, res, next) => {
  try {
    const agencias = await accountModel.distinct("agencia");

    agencias.forEach(async (agencia) => {
      await accountModel
        .updateOne({ agencia: agencia }, { $set: { agencia: 99 } })
        .sort({ balance: -1 });
    });

    res.send(agencias);
  } catch (error) {
    next(error);
  }
});

router.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.baseUrl} -- ${err.message}`);
  res.status(400).send({ error: err.message });
});

export default router;
