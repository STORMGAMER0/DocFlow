import asyncio
import websockets
import json
import sys

async def test_websocket(token, url="ws://localhost:8000"):
    """Test WebSocket connection with detailed debugging"""
    
    ws_url = f"{url}/ws/{token}"
    print(f"🔗 Connecting to: {ws_url}")
    print(f"📝 Token: {token[:30]}...")
    print("-" * 60)
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✅ WebSocket CONNECTED successfully!")
            print("-" * 60)
            
            # Wait for welcome message
            try:
                welcome = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(welcome)
                print(f"📨 Welcome message:")
                print(json.dumps(data, indent=2))
                print("-" * 60)
            except asyncio.TimeoutError:
                print("⚠️  No welcome message received (this is okay)")
                print("-" * 60)
            
            print("👂 Listening for messages... (Press Ctrl+C to stop)")
            print("💡 Now upload a document via Swagger to see real-time updates")
            print("-" * 60)
            
            message_count = 0
            while True:
                try:
                    message = await websocket.recv()
                    data = json.loads(message)
                    message_count += 1
                    
                    print(f"\n📨 Message #{message_count} - Type: {data.get('type', 'unknown')}")
                    print(json.dumps(data, indent=2))
                    print("-" * 60)
                    
                except websockets.exceptions.ConnectionClosed as e:
                    print(f"\n🔌 Connection closed: {e.code} - {e.reason}")
                    break
                    
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"\n❌ Connection failed with status code: {e.status_code}")
        print(f"Response headers: {e.headers}")
        print("\n💡 This usually means:")
        print("   - Invalid token (expired or incorrect)")
        print("   - WebSocket endpoint not accessible")
        print("   - Authentication failed")
        
    except websockets.exceptions.WebSocketException as e:
        print(f"\n❌ WebSocket error: {type(e).__name__}")
        print(f"Details: {e}")
        
    except ConnectionRefusedError:
        print(f"\n❌ Connection refused to {url}")
        print("💡 Make sure the API is running on the correct port")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}")
        print(f"Details: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_ws_debug.py <JWT_TOKEN> [WS_URL]")
        print("\nExample (local):")
        print("  python test_ws_debug.py eyJhbGci...")
        print("\nExample (Codespaces):")
        print("  python test_ws_debug.py eyJhbGci... wss://your-codespace-8000.app.github.dev")
        sys.exit(1)
    
    token = sys.argv[1]
    url = sys.argv[2] if len(sys.argv) > 2 else "ws://localhost:8000"
    
    asyncio.run(test_websocket(token, url))