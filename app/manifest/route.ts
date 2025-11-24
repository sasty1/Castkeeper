export async function GET() {
  return Response.json({
    accountAssociation: {
      header: "eyJmaWQiOjU0MzMzNiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweENFQUNiY0ZjNTcwZjFGNTRFNzg4NjJjRDk2QzU4NDY1NzEwRkYxN2EifQ",
      payload: "eyJkb21haW4iOiJjYXN0a2VlcGVyLXRzZjMudmVyY2VsLmFwcCJ9",
      signature: "PSMmYrKElwaj1XE4EOUrHWHN0sJPgXxqDvrt/i6/zIJ2UbObmIcX98TxkZb9uiQNWcVPzpmmI6JYypWbHdNDIBw="
    },
    frame: {
      version: "1",
      name: "CastKeeper",
      iconUrl: "https://castkeeper-tsf3.vercel.app/icon.png",
      homeUrl: "https://castkeeper-tsf3.vercel.app/",
      requested_permissions: ["signer"],
      frames: [
        {
          path: "/",
          name: "Main"
        }
      ]
    }
  });
}
