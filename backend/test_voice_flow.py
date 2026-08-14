import asyncio
import httpx
import sys
import io
import wave
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

def generate_test_wav_bytes(duration_sec: float = 1.0, freq: float = 440.0, sample_rate: int = 16000) -> bytes:
    """Generates a small valid WAV file in-memory for testing STT endpoints."""
    num_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, num_samples, endpoint=False)
    # Generate simple sine wave
    audio_data = (np.sin(2 * np.pi * freq * t) * 32767).astype(np.int16)

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data.tobytes())

    return buffer.getvalue()

async def test_voice_flow():
    base_url = "http://127.0.0.1:8000/api"
    world_id = "world-company"
    person_id = "person-maya"

    print("\n--- 1. Testing Voice Health & Diagnostics ---")
    async with httpx.AsyncClient(timeout=60.0) as client:
        health_res = await client.get(f"{base_url}/voice/health")
        print(f"Status: {health_res.status_code}")
        health_data = health_res.json()
        print(f"TTS Provider: {health_data['ttsProvider']} (Available: {health_data['ttsAvailable']})")
        print(f"STT Provider: {health_data['sttProvider']} (Available: {health_data['sttAvailable']})")
        print(f"Supported Voices: {health_data['supportedVoicesCount']}")
        assert health_data["supportedVoicesCount"] >= 5, "Curated voice catalog is too small!"

        print("\n--- 2. Testing Voice Catalog List ---")
        voices_res = await client.get(f"{base_url}/voice/voices")
        voices = voices_res.json()
        print(f"Retrieved {len(voices)} voices:")
        for v in voices[:4]:
            print(f"  - [{v['id']}] {v['name']} ({v['gender']}, {v['language']}): {v['description'][:50]}...")
        assert len(voices) > 0, "No voices returned from catalog!"

        print("\n--- 3. Testing Voice Preview Generation ---")
        # Maya Warm Female preview
        prev_res_maya = await client.post(
            f"{base_url}/voice/preview",
            json={"voiceId": "en-US-AvaNeural", "speed": 1.0, "pitch": 1.0}
        )
        print(f"Maya Preview Status: {prev_res_maya.status_code}, Audio Size: {len(prev_res_maya.content)} bytes, Content-Type: {prev_res_maya.headers.get('content-type')}")
        assert prev_res_maya.status_code == 200 and len(prev_res_maya.content) > 1000, "Maya preview synthesis failed!"

        # Rahul Professional Male preview
        prev_res_rahul = await client.post(
            f"{base_url}/voice/preview",
            json={"voiceId": "en-US-AndrewNeural", "speed": 1.0, "pitch": 1.0}
        )
        print(f"Rahul Preview Status: {prev_res_rahul.status_code}, Audio Size: {len(prev_res_rahul.content)} bytes")
        assert prev_res_rahul.status_code == 200 and len(prev_res_rahul.content) > 1000, "Rahul preview synthesis failed!"

        print("\n--- 4. Testing Speech-To-Text (STT) Audio Endpoint ---")
        wav_bytes = generate_test_wav_bytes(duration_sec=1.5)
        stt_res = await client.post(
            f"{base_url}/voice/stt",
            files={"file": ("test_recording.wav", wav_bytes, "audio/wav")}
        )
        print(f"STT Status: {stt_res.status_code}")
        stt_data = stt_res.json()
        print(f"STT Transcript result: '{stt_data['transcript']}', Language: {stt_data['language']}")
        assert stt_res.status_code == 200, "STT endpoint failed!"

        print("\n--- 5. Testing Persona Voice Profile CRUD ---")
        # Get Maya's voice
        maya_voice_res = await client.get(f"{base_url}/worlds/{world_id}/people/person-maya/voice")
        maya_voice = maya_voice_res.json()
        print(f"Maya current voice: {maya_voice['voiceName']} ({maya_voice['voiceGender']}, VoiceId: {maya_voice['voiceId']})")
        assert maya_voice["voiceGender"] == "female", "Maya should have a female voice by default!"

        # Update Maya's voice speaking rate
        update_res = await client.put(
            f"{base_url}/worlds/{world_id}/people/person-maya/voice",
            json={"speakingRate": 1.15, "pitch": 1.05, "autoSpeak": True}
        )
        updated_voice = update_res.json()
        print(f"Maya updated speed: {updated_voice['speakingRate']}x, Pitch: {updated_voice['pitch']}x, AutoSpeak: {updated_voice['autoSpeak']}")
        assert updated_voice["speakingRate"] == 1.15, "Voice profile update was not saved!"

        # Get Rahul's voice
        rahul_voice_res = await client.get(f"{base_url}/worlds/{world_id}/people/person-rahul/voice")
        rahul_voice = rahul_voice_res.json()
        print(f"Rahul voice: {rahul_voice['voiceName']} ({rahul_voice['voiceGender']}, VoiceId: {rahul_voice['voiceId']})")
        assert rahul_voice["voiceGender"] == "male", "Rahul should have a male voice by default!"
        assert rahul_voice["voiceId"] != maya_voice["voiceId"], "Maya and Rahul must use different voice profiles!"

        print("\n--- 6. Testing Full Sentence TTS Synthesis ---")
        tts_text = "I have finished reviewing our company launch plans. Everything is on schedule for September."
        tts_res = await client.post(
            f"{base_url}/voice/tts",
            json={
                "text": tts_text,
                "voiceId": maya_voice["voiceId"],
                "speed": 1.0,
                "pitch": 1.0,
                "personId": person_id
            }
        )
        print(f"TTS Status: {tts_res.status_code}, Audio Size: {len(tts_res.content)} bytes, Type: {tts_res.headers.get('content-type')}")
        assert tts_res.status_code == 200 and len(tts_res.content) > 3000, "Full sentence TTS synthesis failed!"

        print("\n=== ALL MODULE 7 VOICE & PRESENCE TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(test_voice_flow())
