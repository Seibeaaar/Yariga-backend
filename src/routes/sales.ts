import { Router } from "express";

import Sale from "@/models/Sale";
import User from "@/models/User";
import Property from "@/models/Property";

import { PROPERTY_STATUS } from "@/enums/property";
import {
  validateSalesBody,
  checkIfBuyer,
  checkIfSeller,
  checkSaleIdParam,
  validateSalesInfo,
} from "@/middlewares/sales";
import { extractProfileFromToken, verifyJWToken } from "@/middlewares/token";
import { generateErrorMesaage } from "@/utils/common";
import { SALES_STATUS } from "@/enums/sales";
import { io } from "../index";
import { NOTIFICATION_EVENT, NOTIFICATION_TYPE } from "@/enums/notification";
import { generateSalesNotification } from "@/utils/notification";

const SalesRouter = Router();

SalesRouter.post(
  "/create",
  verifyJWToken,
  extractProfileFromToken,
  checkIfBuyer,
  validateSalesBody,
  validateSalesInfo,
  async (req, res) => {
    try {
      const sale = new Sale({
        ...req.body,
        status: SALES_STATUS.Pending,
      });
      await sale.save();
      const { seller, buyer, property } = req.body;
      const { buyerProfile, sellerProfile, propertyBody } = res.locals;
      await User.updateMany(
        { _id: { $in: [seller, buyer] } },
        { $addToSet: { sales: sale.id } },
      );
      await Property.findByIdAndUpdate(
        property,
        {
          status: PROPERTY_STATUS.Reserved,
        },
        {
          new: true,
        },
      );

      const notification = await generateSalesNotification(
        buyerProfile,
        sellerProfile,
        propertyBody,
        NOTIFICATION_EVENT.UpdatedSales,
        NOTIFICATION_TYPE.Booking,
      );
      io.emit(NOTIFICATION_EVENT.NewSales, sale, notification);

      res.status(201).send(sale);
    } catch (e) {
      const message = generateErrorMesaage(e);
      res.status(500).send(message);
    }
  },
);

SalesRouter.put(
  "/update/:id",
  verifyJWToken,
  extractProfileFromToken,
  checkIfBuyer,
  checkSaleIdParam,
  validateSalesBody,
  validateSalesInfo,
  async (req, res) => {
    try {
      const { sale, buyerProfile, sellerProfile, propertyBody } = res.locals;
      const updatedSale = await Sale.findByIdAndUpdate(sale.id, req.body, {
        new: true,
      });

      const notification = await generateSalesNotification(
        buyerProfile,
        sellerProfile,
        propertyBody,
        NOTIFICATION_EVENT.UpdatedSales,
        NOTIFICATION_TYPE.Booking,
      );
      io.emit(NOTIFICATION_EVENT.UpdatedSales, sale, notification);

      res.status(200).send(updatedSale);
    } catch (e) {
      const message = generateErrorMesaage(e);
      res.status(500).send(message);
    }
  },
);

SalesRouter.put(
  "/accept/:id",
  verifyJWToken,
  extractProfileFromToken,
  checkIfSeller,
  checkSaleIdParam,
  async (req, res) => {
    try {
      const { sale } = res.locals;
      const updatedSale = await Sale.findByIdAndUpdate(
        sale.id,
        {
          status: SALES_STATUS.Completed,
        },
        {
          new: true,
        },
      );
      await Property.findByIdAndUpdate(
        sale.property,
        {
          status: PROPERTY_STATUS.Sold,
        },
        {
          new: true,
        },
      );
      res.status(200).send(updatedSale);
    } catch (e) {
      const message = generateErrorMesaage(e);
      res.status(500).send(message);
    }
  },
);

SalesRouter.delete(
  "/delete/:id",
  verifyJWToken,
  extractProfileFromToken,
  checkIfBuyer,
  checkSaleIdParam,
  async (req, res) => {
    try {
      const { sale } = res.locals;
      await Sale.findByIdAndDelete(sale.id);
      await Property.findByIdAndUpdate(
        sale.property,
        {
          status: PROPERTY_STATUS.Free,
        },
        {
          new: true,
        },
      );
      await User.updateMany(
        { _id: { $in: [sale.seller, sale.buyer] } },
        { $pull: { sales: sale.id } },
      );
      res.status(200).send("Successfully deleted a sale");
    } catch (e) {
      const message = generateErrorMesaage(e);
      res.status(500).send(message);
    }
  },
);

SalesRouter.put(
  "/decline/:id",
  verifyJWToken,
  extractProfileFromToken,
  checkIfSeller,
  checkSaleIdParam,
  async (req, res) => {
    try {
      const { sale } = res.locals;
      const updatedSale = await Sale.findByIdAndUpdate(
        sale.id,
        {
          status: SALES_STATUS.Declined,
        },
        {
          new: true,
        },
      );
      await Property.findByIdAndUpdate(
        sale.property,
        {
          status: PROPERTY_STATUS.Free,
        },
        {
          new: true,
        },
      );
      res.status(200).send(updatedSale);
    } catch (e) {
      const message = generateErrorMesaage(e);
      res.status(500).send(message);
    }
  },
);

export default SalesRouter;
