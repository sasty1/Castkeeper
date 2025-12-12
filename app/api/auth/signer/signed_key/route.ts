import { NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { mnemonicToAccount } from 'viem/accounts';

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`,
};

const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signerUuid, publicKey } = body;

    if (!signerUuid || !publicKey) {
      return NextResponse.json(
        { error: 'signerUuid and publicKey are required' },
        { status: 400 }
      );
    }

    const seedPhrase = process.env.SEED_PHRASE;
    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'SEED_PHRASE not configured' },
        { status: 500 }
      );
    }

    const account = mnemonicToAccount(seedPhrase);

    const client = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY!,
    });

    const { user } = await client.lookupUserByCustodyAddress({
      custodyAddress: account.address,
    });
    const appFid = user.fid;

    const deadline = Math.floor(Date.now() / 1000) + 86400;

    const signature = await account.signTypedData({
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: {
        SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
      },
      primaryType: 'SignedKeyRequest',
      message: {
        requestFid: BigInt(appFid),
        key: publicKey,
        deadline: BigInt(deadline),
      },
    });

    const signer = await client.registerSignedKey({
      appFid,
      deadline,
      signature,
      signerUuid,
      sponsor: { sponsored_by_neynar: true },
    });

    return NextResponse.json(signer);
  } catch (error) {
    console.error('Error registering signed key:', error);
    return NextResponse.json(
      { error: 'Failed to register signed key' },
      { status: 500 }
    );
  }
}
