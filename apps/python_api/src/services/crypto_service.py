from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from uuid import UUID
import httpx
import hmac
import hashlib
import os
from datetime import datetime

from models.models import TransactionType, TransactionStatus, Order
from repositories.order_repository import OrderRepository
from services.wallet_service import WalletService

class CryptoService:
    def __init__(self):
        self.order_repository = OrderRepository()
        self.wallet_service = WalletService()
        self.api_key = os.getenv("CRYPTO_API_KEY")
        self.api_secret = os.getenv("CRYPTO_API_SECRET")
        self.api_base_url = os.getenv("CRYPTO_API_BASE_URL")
        self.webhook_secret = os.getenv("CRYPTO_WEBHOOK_SECRET")
    
    async def generate_address(self, currency: str, user_id: UUID) -> Dict[str, Any]:
        """
        Generate a cryptocurrency deposit address for the user
        """
        if not self.api_key or not self.api_base_url:
            raise ValueError("Crypto payment API configuration is missing")
        
        # Validate currency
        supported_currencies = await self._get_supported_currencies()
        if currency.upper() not in supported_currencies:
            raise ValueError(f"Unsupported currency: {currency}")
        
        try:
            # Call external API to generate address
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base_url}/addresses/generate",
                    json={
                        "currency": currency.upper(),
                        "customer_id": str(user_id)
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_msg = f"Failed to generate address: {response.status_code}"
                    try:
                        error_data = response.json()
                        if "message" in error_data:
                            error_msg = f"API Error: {error_data['message']}"
                    except:
                        error_msg = f"Failed to generate address: {response.text}"
                    
                    raise ValueError(error_msg)
                
                return response.json()
        except httpx.RequestError as e:
            raise ValueError(f"Connection error when generating address: {str(e)}")
        except httpx.TimeoutException:
            raise ValueError("Timeout when connecting to crypto payment API")
        except Exception as e:
            raise ValueError(f"Unexpected error generating address: {str(e)}")
    
    async def create_deposit_order(self, db: Session, user_id: UUID, amount: float, currency: str) -> Order:
        """
        Create a cryptocurrency deposit order
        """
        if not self.api_key or not self.api_base_url:
            raise ValueError("Crypto payment API configuration is missing")
        
        try:
            # Validate currency
            supported_currencies = await self._get_supported_currencies()
            if currency.upper() not in supported_currencies:
                raise ValueError(f"Unsupported currency: {currency}")
            
            # Call external API to create order
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base_url}/orders",
                    json={
                        "amount": amount,
                        "currency": currency.upper(),
                        "customer_id": str(user_id),
                        "callback_url": f"{os.getenv('API_BASE_URL')}/api/crypto/webhook"
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_msg = f"Failed to create order: {response.status_code}"
                    try:
                        error_data = response.json()
                        if "message" in error_data:
                            error_msg = f"API Error: {error_data['message']}"
                    except:
                        error_msg = f"Failed to create order: {response.text}"
                    
                    raise ValueError(error_msg)
                
                order_data = response.json()
                
                # Create order in database
                order = self.order_repository.create(
                    db=db,
                    user_id=user_id,
                    external_id=order_data["id"],
                    amount=amount,
                    currency=currency.upper(),
                    payment_address=order_data.get("payment_address"),
                    status=order_data.get("status", "pending"),
                    expires_at=datetime.fromisoformat(order_data.get("expires_at")) if "expires_at" in order_data else None
                )
                
                return order
        except httpx.RequestError as e:
            raise ValueError(f"Connection error when creating order: {str(e)}")
        except httpx.TimeoutException:
            raise ValueError("Timeout when connecting to crypto payment API")
        except ValueError as e:
            # Re-raise ValueError exceptions
            raise e
        except Exception as e:
            raise ValueError(f"Unexpected error creating order: {str(e)}")
    
    def get_order(self, db: Session, order_id: UUID) -> Optional[Order]:
        """
        Get an order by ID
        """
        return self.order_repository.get_by_id(db, order_id)
    
    async def update_order_status(self, db: Session, order_id: UUID) -> Order:
        """
        Update an order's status from the external API
        """
        try:
            order = self.order_repository.get_by_id(db, order_id)
            if not order:
                raise ValueError("Order not found")
            
            # If order is already completed or failed, no need to update
            if order.status in ["completed", "failed"]:
                return order
            
            if not self.api_key or not self.api_base_url:
                raise ValueError("Crypto payment API configuration is missing")
            
            # Call external API to get order status
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/orders/{order.external_id}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_msg = f"Failed to get order status: {response.status_code}"
                    try:
                        error_data = response.json()
                        if "message" in error_data:
                            error_msg = f"API Error: {error_data['message']}"
                    except:
                        error_msg = f"Failed to get order status: {response.text}"
                    
                    raise ValueError(error_msg)
                
                order_data = response.json()
                
                # Update order status
                updated_order = self.order_repository.update(
                    db=db,
                    order_id=order_id,
                    status=order_data.get("status", order.status),
                    transaction_hash=order_data.get("transaction_hash", order.transaction_hash)
                )
                
                # If order is completed, create a deposit transaction
                if updated_order.status == "completed" and not order.is_processed:
                    try:
                        transaction = self.wallet_service.create_transaction(
                            db=db,
                            user_id=order.user_id,
                            amount=order.amount,
                            transaction_type=TransactionType.DEPOSIT,
                            status=TransactionStatus.COMPLETED,
                            reference=f"Crypto deposit: {order.currency}",
                            metadata={
                                "order_id": str(order_id),
                                "currency": order.currency,
                                "transaction_hash": updated_order.transaction_hash
                            }
                        )
                        
                        # Add the deposit to the user's wallet
                        self.wallet_service.process_deposit(
                            db=db,
                            user_id=order.user_id,
                            amount=order.amount,
                            transaction_id=transaction.id,
                            description=f"Crypto deposit: {order.currency}"
                        )
                        
                        # Mark order as processed
                        self.order_repository.update(
                            db=db,
                            order_id=order_id,
                            is_processed=True
                        )
                    except Exception as e:
                        # Log the error but don't fail the entire operation
                        # This allows us to retry processing later
                        print(f"Error processing completed order: {str(e)}")
                        # Consider adding proper logging here
                
                return updated_order
        except httpx.RequestError as e:
            raise ValueError(f"Connection error when updating order status: {str(e)}")
        except httpx.TimeoutException:
            raise ValueError("Timeout when connecting to crypto payment API")
        except ValueError as e:
            # Re-raise ValueError exceptions
            raise e
        except Exception as e:
            raise ValueError(f"Unexpected error updating order status: {str(e)}")
    
    async def process_webhook_notification(self, db: Session, payload: Dict[str, Any]) -> str:
        """
        Process a webhook notification from the crypto payment API
        """
        try:
            # Extract order ID from payload
            external_order_id = payload.get("order_id")
            if not external_order_id:
                raise ValueError("Missing order_id in webhook payload")
            
            # Get order from database
            order = self.order_repository.get_by_external_id(db, external_order_id)
            if not order:
                raise ValueError(f"Order not found: {external_order_id}")
            
            # Extract status from payload
            status = payload.get("status")
            if not status:
                raise ValueError("Missing status in webhook payload")
            
            # Update order status
            updated_order = self.order_repository.update(
                db=db,
                order_id=order.id,
                status=status,
                transaction_hash=payload.get("transaction_hash", order.transaction_hash)
            )
            
            # If order is completed, create a deposit transaction
            if status == "completed" and not order.is_processed:
                try:
                    transaction = self.wallet_service.create_transaction(
                        db=db,
                        user_id=order.user_id,
                        amount=order.amount,
                        transaction_type=TransactionType.DEPOSIT,
                        status=TransactionStatus.COMPLETED,
                        reference=f"Crypto deposit: {order.currency}",
                        metadata={
                            "order_id": str(order.id),
                            "currency": order.currency,
                            "transaction_hash": updated_order.transaction_hash
                        }
                    )
                    
                    # Add the deposit to the user's wallet
                    self.wallet_service.process_deposit(
                        db=db,
                        user_id=order.user_id,
                        amount=order.amount,
                        transaction_id=transaction.id,
                        description=f"Crypto deposit: {order.currency}"
                    )
                    
                    # Mark order as processed
                    self.order_repository.update(
                        db=db,
                        order_id=order.id,
                        is_processed=True
                    )
                    
                    return f"Order {external_order_id} completed and processed"
                except Exception as e:
                    # Log the error but don't fail the entire operation
                    # This allows us to retry processing later
                    error_msg = f"Error processing completed order webhook: {str(e)}"
                    print(error_msg)
                    # Consider adding proper logging here
                    return f"Order {external_order_id} status updated to {status}, but processing failed: {error_msg}"
            
            return f"Order {external_order_id} updated to {status}"
        except ValueError as e:
            # Re-raise ValueError exceptions with clear message
            raise ValueError(f"Webhook processing error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Unexpected error processing webhook: {str(e)}")
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify the signature of a webhook notification
        """
        try:
            if not self.webhook_secret:
                return False
            
            # Calculate HMAC signature
            calculated_signature = hmac.new(
                self.webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(calculated_signature, signature)
        except Exception as e:
            # Log the error and return False to indicate verification failure
            error_msg = f"Error verifying webhook signature: {str(e)}"
            print(error_msg)
            # Consider adding proper logging here
            return False
    
    async def _get_supported_currencies(self) -> List[str]:
        """
        Get the list of supported currencies from the crypto payment API
        """
        if not self.api_key or not self.api_base_url:
            raise ValueError("Crypto payment API configuration is missing")
        
        try:
            # Call external API to get supported currencies
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/currencies",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_msg = f"Failed to get supported currencies: {response.status_code}"
                    try:
                        error_data = response.json()
                        if "message" in error_data:
                            error_msg = f"API Error: {error_data['message']}"
                    except:
                        error_msg = f"Failed to get supported currencies: {response.text}"
                    
                    raise ValueError(error_msg)
                
                currencies = response.json()
                return [currency["code"] for currency in currencies]
        except httpx.RequestError as e:
            raise ValueError(f"Connection error when fetching currencies: {str(e)}")
        except httpx.TimeoutException:
            raise ValueError("Timeout when connecting to crypto payment API")
        except Exception as e:
            raise ValueError(f"Unexpected error fetching currencies: {str(e)}")
            
    async def get_supported_cryptocurrencies(self) -> List[Dict[str, str]]:
        """
        Get a list of supported cryptocurrencies from the crypto payment API
        """
        try:
            # Get supported currencies
            currencies = await self._get_supported_currencies()
            
            # Format response
            return [
                {"code": currency, "name": self._get_currency_name(currency)}
                for currency in currencies
            ]
        except Exception as e:
            # Log the error and return an empty list
            error_msg = f"Error retrieving supported cryptocurrencies: {str(e)}"
            print(error_msg)
            # Consider adding proper logging here
            return []
            
    def _get_currency_name(self, code: str) -> str:
        """
        Get the human-readable name for a currency code
        """
        currency_names = {
            "BTC": "Bitcoin",
            "ETH": "Ethereum",
            "USDT": "Tether",
            "USDC": "USD Coin",
            "XRP": "Ripple",
            "SOL": "Solana",
            "ADA": "Cardano",
            "DOGE": "Dogecoin"
        }
        return currency_names.get(code, code)