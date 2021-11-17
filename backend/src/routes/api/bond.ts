import {Router, Response} from "express";
import {check, validationResult} from "express-validator/check";
import HttpStatusCodes from "http-status-codes";

import Request from "../../types/Request";
import BondPool, {IBondPool} from "../../models/BondPool";

const router: Router = Router();

// TODO: Implement a get request as well

// @route   GET api/imo/
// @desc    Get current user's profile
// @access  Public
router.get("/", async (req: Request, res: Response) => {

    try {

        // Filter by user, must be of own type

        const bondPoolList: IBondPool[] = await BondPool.find();

        if ((bondPoolList != []) && !bondPoolList) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json({
                errors: [
                    {
                        msg: "There is no profile for this user",
                    },
                ],
            });
        }

        console.log("Collected pool list is: ", bondPoolList);

        res.json(bondPoolList);

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
    check("user", "Please include 'user' in the submission fields").exists(), [
        // Amounts / Variables
        check("bump", "Please include 'bump' in the submission fields").exists(),
        check("bondTimeFrame", "Please include 'bondTimeFrame' in the submission fields").exists(),
        check("sendAmount", "Please include 'sendAmount' in the submission fields").exists(),
        // Accounts
        check("bondAccount", "Please include 'bondAccount' in the submission fields").exists(),
        check("bondAuthority", "Please include 'bondAuthority' in the submission fields").exists(),
        check("initializer", "Please include 'initializer' in the submission fields").exists(),
        check("initializerTokenAccount", "Please include 'initializerTokenAccount' in the submission fields").exists(),
        check("bondTokenAccount", "Please include 'bondTokenAccount' in the submission fields").exists(),
        check("bondSolanaAccount", "Please include 'bondSolanaAccount' in the submission fields").exists(),
        check("redeemableMint", "Please include 'redeemableMint' in the submission fields").exists(),
    ],

    async (req: Request, res: Response) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(HttpStatusCodes.BAD_REQUEST)
                .json({errors: errors.array()});
        }

        const {
            user,
            bump,
            bondTimeFrame,
            sendAmount,
            bondAccount,
            bondAuthority,
            initializer,
            initializerTokenAccount,
            bondTokenAccount,
            bondSolanaAccount,
            redeemableMint
        } = req.body;

        try {

            // TODO: Check if the pool with the same name and or public key exists
            let imoPool: IBondPool = await BondPool.findOne({bondAccount});

            if (imoPool) {
                return res.status(HttpStatusCodes.BAD_REQUEST).json({
                    errors: [
                        {
                            msg: "Bond Account already exists"
                        }
                    ]
                });
            }

            // Build IMO object based on IImoPool
            const bondPoolFields = {
                user: user,
                bump: bump,
                bondTimeFrame: bondTimeFrame,
                sendAmount: sendAmount,
                bondAccount: bondAccount,
                bondAuthority: bondAuthority,
                initializer: initializer,
                initializerTokenAccount: initializerTokenAccount,
                bondTokenAccount: bondTokenAccount,
                bondSolanaAccount: bondSolanaAccount,
                redeemableMint: redeemableMint,
            };

            let insertImoPool = new BondPool(bondPoolFields);
            await insertImoPool.save();
            console.log("Saved into the imo pool")

            return res.json(bondPoolFields);

        } catch (err) {
            console.error(err.message);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send("Server Error");
        }

    }
);

export default router;
