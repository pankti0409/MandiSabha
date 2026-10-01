"""Tests for OTP service — hashing, verification."""
import pytest

from app.auth.otp import generate_otp, hash_otp, verify_otp_hash


def test_otp_length():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()


def test_otp_roundtrip():
    otp = "123456"
    stored, _ = hash_otp(otp)
    assert verify_otp_hash(otp, stored)


def test_wrong_otp_fails():
    otp = "123456"
    stored, _ = hash_otp(otp)
    assert not verify_otp_hash("999999", stored)


def test_different_otps_have_different_hashes():
    h1, _ = hash_otp("111111")
    h2, _ = hash_otp("222222")
    assert h1 != h2


def test_same_otp_different_salts():
    """Same OTP should produce different hashes due to random salt."""
    h1, _ = hash_otp("123456")
    h2, _ = hash_otp("123456")
    assert h1 != h2


def test_verify_wrong_format():
    """Malformed hash should return False, not raise."""
    assert not verify_otp_hash("123456", "bad_format")
    assert not verify_otp_hash("123456", "")
