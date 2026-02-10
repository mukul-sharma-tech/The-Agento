import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// GET: List all pending employees for admin's company
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Only admins can access this" }, { status: 403 });
    }

    await connectDB();

    // Get all pending employees in the same company
    const pendingEmployees = await User.find({
      company_id: session.user.company_id,
      role: "employee",
      accountVerified: false,
    }).select("-password");

    // Get all verified employees
    const verifiedEmployees = await User.find({
      company_id: session.user.company_id,
      role: "employee",
      accountVerified: true,
    }).select("-password");

    return NextResponse.json({
      pendingEmployees,
      verifiedEmployees,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { message: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// PATCH: Verify or reject an employee
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Only admins can access this" }, { status: 403 });
    }

    const { employeeId, action } = await req.json();

    if (!employeeId || !action) {
      return NextResponse.json(
        { message: "Employee ID and action are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const employee = await User.findById(employeeId);

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // Check same company
    if (employee.company_id !== session.user.company_id) {
      return NextResponse.json(
        { message: "Employee not in your company" },
        { status: 403 }
      );
    }

    if (action === "verify") {
      employee.accountVerified = true;
      employee.verifiedBy = session.user.id;
      employee.verifiedAt = new Date();
      await employee.save();
      
      return NextResponse.json(
        { message: "Employee verified successfully" },
        { status: 200 }
      );
    } else if (action === "reject") {
      // Delete the employee account
      await User.findByIdAndDelete(employeeId);
      
      return NextResponse.json(
        { message: "Employee rejected and removed" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'verify' or 'reject'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error managing employee:", error);
    return NextResponse.json(
      { message: "Failed to manage employee" },
      { status: 500 }
    );
  }
}
