import { ReactElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Column } from "react-table";
import TableHOC from "../components/admin/TableHOC";


type DataType = {
    _id: string;
    amount: number;
    quantity: number;
    discount: number;
    status: ReactElement;
    action: ReactElement;
};

const column: Column<DataType>[] = [
    {
        Header: "ID",
        accessor: "_id",
    },
    {
        Header: "Quantity",
        accessor: "quantity",
    },
    {
        Header: "Discount",
        accessor: "discount",
    },
    {
        Header: "Amount",
        accessor: "amount",
    },
    {
        Header: "Status",
        accessor: "status",
    },
    {
        Header: "Action",
        accessor: "action",
    },
];

const Orders = () => {


    const [rows, setRows] = useState<DataType[]>([]);

    

    useEffect(() => {

    }, [])

    const Table = TableHOC<DataType>(
        column,
        rows,
        "dashboard-product-box",
        "Orders",
        rows.length > 6
    )();
    return (
        <div>Orders</div>
    )
}

export default Orders