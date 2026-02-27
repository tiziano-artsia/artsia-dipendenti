import {useEffect, useState} from "react";

export function useMonthSmartCounts(year: number, month: number) {
    const [counts, setCounts] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`/api/smartworking/count?year=${year}&month=${month}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => setCounts(data.counts || {}));
    }, [year, month])

    return counts;
}
