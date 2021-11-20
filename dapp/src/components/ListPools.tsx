import React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {Bond} from "../types/bond";

const ListPools = (props: any) => {

    // Make the RPC call here.
    // I hope phantom supports this way of making submissions ...
    const [bondList, setBondList] = useState<Bond[]>([]);

    const getBondList = async () => {
        let request_body = {};

        try {
            let bondListDBResponse = await axios({
                method: 'get',
                url: 'http://127.0.0.1:5000/api/bond',
                data: request_body
            });
            console.log("Response from getting bonds in pool in the database is: ", bondListDBResponse);

            // Save this into the ImoList
            setBondList((_: any) => {
                return bondListDBResponse.data;
            });

        } catch (error) {
            console.log("Error making request");
            console.log(JSON.stringify(error));
        }
    }

    // Update this every couple minutes

    useEffect(() => {
        getBondList();
        setInterval(() => {
            getBondList();
        }, 10000);
    }, []);

    return (
        <>
            {/*overflow-hidden*/}
            {/*bg-white*/}
            <div className="sm:rounded-xl bg-gray-50 border-8 rounded-3xl content-center">
                <div className="px-4 py-5 sm:p-6">

                    <h2 className="mx-auto center text-3xl lg:text-3xl font-bold text-gray-800 pb-5 border-b border-gray-50">
                        Redeem Your Bonds
                    </h2>

                    <div className="p-2 w-full">

                        <div
                            className={"items-center bg-white leading-none text-indigo-600 rounded-full p-2 shadow text-teal text-sm w-full"}>
                            <span
                                className="inline-flex bg-indigo-300 text- rounded-full h-6 px-3 justify-center items-center">
                                    Bond Pool Addresses
                            </span>
                            <span className="ml-5 inline-flex px-2"> Bond Time Frame </span>
                            <span className="ml-5 inline-flex px-2"> SOL bound</span>
                            <span className="ml-5 inline-flex px-2"> Bond Address </span>
                            <span
                                className="ml-5 inline-flex bg-indigo-600 text-white rounded-full h-6 px-3 justify-center items-center">
                                    Redeem Bond
                            </span>
                        </div>
                    </div>

                    {
                        bondList.map((bondItem: Bond) => {
                            // if (bondItem.user === )
                            let bondText = JSON.stringify(bondItem);
                            return (
                                <div className="p-2 w-full">
                                    <div
                                        className="items-center bg-white text-indigo-600 rounded-full p-2 shadow text-teal text-sm w-full">
                                            <span
                                                className="inline-flex bg-indigo-300 text- rounded-full h-6 px-3 justify-center items-center">
                                                Bond Pool Addresss
                                            </span>
                                        <span className="ml-5 inline-flex px-2">
                                                {
                                                    // bondItem.bondAccount
                                                    bondItem.bondTimeFrame
                                                }
                                            </span>
                                        <span className="ml-5 inline-flex px-2">
                                                {
                                                    bondItem.sendAmount
                                                }
                                            </span>
                                        <span className="ml-5 inline-flex px-2">
                                                {
                                                    bondItem.bondAccount
                                                }
                                            </span>
                                        <span
                                            className="ml-5 inline-flex bg-indigo-600 text-white rounded-full h-6 px-3 justify-center items-center">
                                                Redeem Bond
                                            </span>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </>
    );
};

export default ListPools;