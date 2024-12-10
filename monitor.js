const web3 = require('@solana/web3.js');
const axios = require('axios');

const connection = new web3.Connection('https://special-cold-shard.solana-mainnet.quiknode.pro/2e94b18cb7833ffd1e49b6e452de98cfef68a753', 'confirmed');
const WATCH_ADDRESS = new web3.PublicKey('B1XbZeQYZxv5ezBpBgomEUqDvTbM8HwSYfktcpBGkgjg');

async function submitSignature(walletAddress, signature, tournamentId, prompt) {
    const data = JSON.stringify({
        "prompt": prompt,
        "walletAddress": walletAddress,
        "signature": signature
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://jailbreakme.xyz/api/conversation/submit/${tournamentId}`,
        headers: { 
            'content-type': 'application/json', 
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        console.log('Signature submitted:', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Error submitting signature:', error);
        throw error;
    }
}

async function monitorAddress(tournamentId) {
    console.log(`Starting to monitor address: ${WATCH_ADDRESS.toString()}`);

    const subscriptionId = connection.onProgramAccountChange(
        WATCH_ADDRESS,
        async (accountInfo, context) => {
            console.log('New transaction detected!');
            
            try {
                const signatures = await connection.getSignaturesForAddress(
                    WATCH_ADDRESS,
                    { limit: 1 }
                );

                if (signatures.length > 0) {
                    const latestSignature = signatures[0].signature;
                    console.log('Transaction Signature:', latestSignature);
                    
                    // Submit signature to tournament
                    await submitSignature(walletAddress, latestSignature, tournamentId, "Test prompt");
                
                }
            } catch (error) {
                console.error('Error processing transaction:', error);
            }
        },
        'confirmed'
    );

    console.log('Monitoring started. Press Ctrl+C to stop.');
    
    process.on('SIGINT', () => {
        console.log('Stopping monitor...');
        connection.removeAccountChangeListener(subscriptionId);
        process.exit();
    });
}

const tournamentId = '675785989011450721df3126';
const walletAddress = '5QfQ88NscBcLjTvpVfid3Qa268WF4awdphx1pZswwzw7';
monitorAddress(tournamentId).catch(console.error);
