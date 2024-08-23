import { Request, Response, NextFunction } from "express";

import { AGREEMENT_STATUS } from "@/enums/agreement";
import { PROPERTY_STATUS } from "@/enums/property";
import RentAgreement from "@/models/Agreement/RentAgreement";
import { generateErrorMesaage } from "@/utils/common";
import { AGREEMENT_PAGE_LIMIT } from "@/constants/agreement";

import { changePropertyStatus } from "@/utils/property";
import { processPageQueryParam } from "@/utils/common";
import { USER_ROLE } from "@/enums/user";

export const handleGetRentAgreements = async (req: Request, res: Response) => {
  try {
    const { page } = req.query;
    const { profile } = res.locals;
    const pageNumber = processPageQueryParam(page as string | undefined);

    const startIndex = (pageNumber - 1) * AGREEMENT_PAGE_LIMIT;
    const results = await RentAgreement.find({
      [profile.role === USER_ROLE.Landlord ? "seller" : "buyer"]: profile.id,
    })
      .skip(startIndex)
      .limit(AGREEMENT_PAGE_LIMIT);
    const total = results.length;

    res.status(200).send({
      properties: results,
      total,
      page: pageNumber,
      pages: Math.ceil(total / AGREEMENT_PAGE_LIMIT),
    });
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementCreation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const agreement = new RentAgreement({
      ...req.body,
      status: AGREEMENT_STATUS.Pending,
    });
    await agreement.save();

    res.status(201).send(agreement);
    res.locals.agreement = agreement;
    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { agreement } = res.locals;
    const updatedAgreement = await RentAgreement.findByIdAndUpdate(
      agreement.id,
      req.body,
      {
        new: true,
      },
    );
    res.status(200).send(updatedAgreement);
    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementAccept = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { agreement } = res.locals;

    const updatedAgreement = await RentAgreement.findByIdAndUpdate(
      agreement.id,
      {
        status: AGREEMENT_STATUS.Settled,
      },
      {
        new: true,
      },
    );

    const updatedProperty = await changePropertyStatus(
      agreement.property,
      PROPERTY_STATUS.Reserved,
    );

    res.locals.property = updatedProperty;

    res.status(200).send({
      agreement: updatedAgreement,
      property: updatedProperty,
    });

    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementDelete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      agreement: { id, property },
    } = res.locals;
    await RentAgreement.findByIdAndDelete(id);

    await changePropertyStatus(property, PROPERTY_STATUS.Free);

    res.status(200).send(`Agreement ${id} successfully deleted.`);
    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementDecline = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      agreement: { id, property },
    } = res.locals;
    const updatedAgreement = await RentAgreement.findByIdAndUpdate(
      id,
      {
        status: AGREEMENT_STATUS.Declined,
      },
      {
        new: true,
      },
    );

    const updatedProperty = await changePropertyStatus(
      property,
      PROPERTY_STATUS.Free,
    );
    res.locals.property = updatedProperty;
    res.status(200).send(updatedAgreement);
    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};

export const handleRentAgreementComplete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      agreement: { id, property },
    } = res.locals;
    const updatedAgreement = await RentAgreement.findByIdAndUpdate(
      id,
      {
        status: AGREEMENT_STATUS.Completed,
      },
      {
        new: true,
      },
    );

    const updatedProperty = await changePropertyStatus(
      property,
      PROPERTY_STATUS.Sold,
    );
    res.locals.property = updatedProperty;
    res.status(200).send(updatedAgreement);
    next();
  } catch (e) {
    res.status(500).send(generateErrorMesaage(e));
  }
};
