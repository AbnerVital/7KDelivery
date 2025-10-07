import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const addressId = params.id;

    // Verify the address belongs to the current user
    const address = await db.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Endereço não encontrado' },
        { status: 404 }
      );
    }

    // Delete the address
    await db.address.delete({
      where: {
        id: addressId
      }
    });

    return NextResponse.json({
      message: 'Endereço removido com sucesso',
      addressId: addressId
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    
    return NextResponse.json(
      { error: 'Erro ao remover endereço' },
      { status: 500 }
    );
  }
}