import { Router, Response } from "express";
import { check, validationResult } from "express-validator/check";
import HttpStatusCodes from "http-status-codes";

import Payload from "../../types/Payload";
import Request from "../../types/Request";
import ImoPool, { IImoPool } from "../../models/ImoPool";

const router: Router = Router();

// TODO: Implement a get request as well

// @route   GET api/imo/
// @desc    Get current user's profile
// @access  Public
router.get("/", async (req: Request, res: Response) => {
    try {
        const imoPoolList: IImoPool[] = await ImoPool.find();

        if ( (imoPoolList != []) && !imoPoolList) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
                errors: [
                    {
                        msg: "There is no profile for this user",
                    },
                ],
            });
        }

        console.log("Collected pool list is: ", imoPoolList);

        res.json(imoPoolList);
    } catch (err) {
        console.error(err.message);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
    }
});

// @route   POST api/imo
// @desc    Register IMO given their email and password, returns the token upon successful registration
// @access  Public
router.post(
    "/",
      check("creatorAddress", "Please include the creatorAddress field").exists(),[
      check("imoName", "Please include the imoName field").exists(),
      check("imoStart", "Please include the imoStart field").exists(),
      check("imoStakeEnd", "Please include the imoStakeEnd field").exists(),
      check("imoEnd", "Please include the imoEnd field").exists(),
      check("imoPoolAddress", "Please include the imoPoolAddress field").exists(),
      check("imoPoolAuthorityAddress", "Please include the imoPoolAuthorityAddress field").exists(),
      check("imoTokenMintAddress", "Please include the imoTokenMintAddress field").exists(),
      check("imoTokenPoolAccountAddress", "Please include the imoTokenPoolAccountAddress field").exists(),
      check("imoUsdcMintAddress", "Please include the imoUsdcMintAddress field").exists(),
      check("imoUsdcPoolAccountAddress", "Please include the imoUsdcPoolAccountAddress field").exists(),
      check("imoRedeemableMintAddress", "Please include the imoRedeemableMintAddress field").exists(),
    ],

    async (req: Request, res: Response) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
            .status(HttpStatusCodes.BAD_REQUEST)
            .json({ errors: errors.array() });
      }

      const {
          creatorAddress,
          imoName,
          imoStart,
          imoStakeEnd,
          imoEnd,
          imoPoolAddress,
          imoPoolAuthorityAddress,
          imoTokenMintAddress,
          imoTokenPoolAccountAddress,
          imoUsdcMintAddress,
          imoUsdcPoolAccountAddress,
          imoRedeemableMintAddress
      } = req.body;

      try {

          // TODO: Check if the pool with the same name and or public key exists
        let imoPool: IImoPool = await ImoPool.findOne({ imoName });

        if (imoPool) {
          return res.status(HttpStatusCodes.BAD_REQUEST).json({
            errors: [
              {
                msg: "IMO Name already exists"
              }
            ]
          });
        }

        // Build IMO object based on IImoPool
        const imoFields = {
            creatorAddress: creatorAddress,
            imoName: imoName,
            imoStart: imoStart,
            imoStakeEnd: imoStakeEnd,
            imoEnd: imoEnd,
            imoPoolAddress: imoPoolAddress,
            imoPoolAuthorityAddress: imoPoolAuthorityAddress,
            imoTokenMintAddress: imoTokenMintAddress,
            imoTokenPoolAccountAddress: imoTokenPoolAccountAddress,
            imoUsdcMintAddress: imoUsdcMintAddress,
            imoUsdcPoolAccountAddress: imoUsdcPoolAccountAddress,
            imoRedeemableMintAddress: imoRedeemableMintAddress
        };

        let insertImoPool = new ImoPool(imoFields);
        await insertImoPool.save();
        console.log("Saved into the imo pool")

        return res.json(imoFields);

      } catch (err) {
        console.error(err.message);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
      }

    }
);

export default router;
